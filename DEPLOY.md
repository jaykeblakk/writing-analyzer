# Deploying Writing Analyzer to EKS

## Prerequisites

- EKS cluster running (from Terraform) — uses **EKS Auto Mode** (AWS-managed compute)
- `kubectl` configured for your cluster
- Docker (for building images) — or use **AWS CloudShell** (see below)
- AWS CLI (for ECR)

## Option A: AWS CloudShell (no local Docker needed)

CloudShell has Docker pre-installed. **Note:** Docker in CloudShell is available in select regions (e.g. us-east-1, us-east-2, us-west-2). If your cluster is in us-west-1, you may need to use us-west-2 CloudShell and push to ECR in that region, or use Option B.

### 1. Open CloudShell and clone your repo

```bash
git clone https://github.com/YOUR_USERNAME/writing-analyzer.git
cd writing-analyzer
```

(Or upload your project as a zip and unzip it.)

### 2. Set region and get ECR login

```bash
export AWS_REGION=us-west-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
ECR_URL=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
```

### 3. Create ECR repos (if not exists)

```bash
aws ecr create-repository --repository-name writing-analyzer-backend --region $AWS_REGION 2>/dev/null || true
aws ecr create-repository --repository-name writing-analyzer-frontend --region $AWS_REGION 2>/dev/null || true
```

### 4. Build and push images

```bash
cd backend
docker build -t writing-analyzer-backend:latest .
docker tag writing-analyzer-backend:latest $ECR_URL/writing-analyzer-backend:latest
docker push $ECR_URL/writing-analyzer-backend:latest

cd ../frontend
docker build -t writing-analyzer-frontend:latest .
docker tag writing-analyzer-frontend:latest $ECR_URL/writing-analyzer-frontend:latest
docker push $ECR_URL/writing-analyzer-frontend:latest
```

### 5. Continue from Step 1 (Configure kubectl) below

CloudShell has `kubectl` and `aws` pre-installed. Run `aws eks update-kubeconfig` and proceed with the rest of the deployment.

---

## Option B: Local machine or remote server

## Step 1: Configure kubectl (both options)

```bash
aws eks update-kubeconfig --region us-west-1 --name writing-analyzer
```

Replace `us-west-1` and `writing-analyzer` if you used different values.

## Step 2: Create an ECR repository (or use another registry)

```bash
# Create ECR repos
aws ecr create-repository --repository-name writing-analyzer-backend --region us-west-1
aws ecr create-repository --repository-name writing-analyzer-frontend --region us-west-1

# Get your account ID and login
aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin 106933695764.dkr.ecr.us-west-1.amazonaws.com
```

Replace `106933695764` with your AWS account ID.

## Step 3: Build and push Docker images

```bash
# From project root
cd backend
docker build -t writing-analyzer-backend:latest .
docker tag writing-analyzer-backend:latest 106933695764.dkr.ecr.us-west-1.amazonaws.com/writing-analyzer-backend:latest
docker push 106933695764.dkr.ecr.us-west-1.amazonaws.com/writing-analyzer-backend:latest

cd ../frontend
docker build -t writing-analyzer-frontend:latest .
docker tag writing-analyzer-frontend:latest 106933695764.dkr.ecr.us-west-1.amazonaws.com/writing-analyzer-frontend:latest
docker push 106933695764.dkr.ecr.us-west-1.amazonaws.com/writing-analyzer-frontend:latest
```

## Step 4: Update Kubernetes manifests with your image URLs

Edit `k8s/backend.yaml` and `k8s/frontend.yaml` - replace the `image:` lines with your ECR URLs:

```yaml
# backend.yaml
image: 106933695764.dkr.ecr.us-west-1.amazonaws.com/writing-analyzer-backend:latest

# frontend.yaml  
image: 106933695764.dkr.ecr.us-west-1.amazonaws.com/writing-analyzer-frontend:latest
```

And set `imagePullPolicy: Always` (or remove it to default to Always when using a registry).

## Step 5: (Optional) Database secret

If you have RDS PostgreSQL:

```bash
cp k8s/db-secret.yaml.example k8s/db-secret.yaml
# Edit k8s/db-secret.yaml with your RDS credentials
kubectl apply -f k8s/db-secret.yaml
```

**Without the secret**: The app runs in in-memory mode (no persistence between restarts). You can deploy and test without a database first.

## Step 6: Deploy to Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

## Step 7: Get the app URL

The frontend uses a LoadBalancer. Get the external IP:

```bash
kubectl get svc -n writing-analyzer writing-analyzer-frontend -w
```

Wait for `EXTERNAL-IP` to appear (may take 2-5 minutes). Then open `http://<EXTERNAL-IP>` in your browser.

## Troubleshooting

**Pods not starting?**
```bash
kubectl get pods -n writing-analyzer
kubectl describe pod <pod-name> -n writing-analyzer
kubectl logs <pod-name> -n writing-analyzer
```

**Image pull errors?** Ensure your EKS nodes have permission to pull from ECR. The default node role usually has this. If using a different registry, you may need to create an imagePullSecret.

**Database connection issues?** Check the secret exists and has correct values. Verify RDS security group allows traffic from EKS nodes.

**Prefer t3a.medium instances?** The built-in general-purpose pool may use various instance types. To restrict to t3a.medium, apply the optional NodePool: `kubectl apply -f k8s/nodepool-t3a-medium.yaml`
