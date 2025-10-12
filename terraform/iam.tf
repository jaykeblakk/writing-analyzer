# IAM role for EKS nodes
resource "aws_iam_role" "eks_nodes" {
  name = "writing-analyzer-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "writing-analyzer-eks-node-role"
  }
}

# Attach required AWS managed policies for EKS nodes
resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

# Custom policy for CloudWatch Logs
resource "aws_iam_policy" "eks_cloudwatch_logs" {
  name        = "writing-analyzer-eks-cloudwatch-logs"
  description = "Allow EKS nodes to write to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cloudwatch_logs" {
  policy_arn = aws_iam_policy.eks_cloudwatch_logs.arn
  role       = aws_iam_role.eks_nodes.name
}

# Custom policy for S3 access (for storing/retrieving files if needed)
resource "aws_iam_policy" "eks_s3_access" {
  name        = "writing-analyzer-eks-s3-access"
  description = "Allow EKS nodes to access S3 for application needs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "arn:aws:s3:::writing-analyzer-*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::writing-analyzer-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_s3_access" {
  policy_arn = aws_iam_policy.eks_s3_access.arn
  role       = aws_iam_role.eks_nodes.name
}

# IAM role for EKS cluster service
resource "aws_iam_role" "eks_cluster" {
  name = "writing-analyzer-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "writing-analyzer-eks-cluster-role"
  }
}

# Attach required policies for EKS cluster
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# Output the IAM role ARNs
output "eks_node_role_arn" {
  description = "ARN of the EKS node IAM role"
  value       = aws_iam_role.eks_nodes.arn
}

output "eks_cluster_role_arn" {
  description = "ARN of the EKS cluster IAM role"
  value       = aws_iam_role.eks_cluster.arn
}

