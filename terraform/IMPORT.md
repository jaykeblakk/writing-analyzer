# Importing Existing Resources into Terraform

If you get errors like "EntityAlreadyExists" when running Terraform, the resource exists in AWS but not in Terraform state. Run these imports **once** before applying.

## Prerequisites

- Terraform CLI configured for your HCP Terraform workspace:
  ```bash
  cd terraform
  terraform login    # Authenticate to HCP Terraform
  terraform init     # Connects to remote state
  ```

## Import the Node Group IAM Role

If you see: `Role with name writing-analyzer-eks-cluster-role already exists`

```bash
terraform import 'module.eks.module.eks_managed_node_group.aws_iam_role.this["default"]' writing-analyzer-eks-cluster-role
```

## Import the Full Cluster (if created manually)

If importing an entirely manually-created cluster:

```bash
# Cluster
terraform import 'module.eks.aws_eks_cluster.this[0]' writing-analyzer

# Node group
terraform import 'module.eks.module.eks_managed_node_group.aws_eks_node_group.this["default"]' writing-analyzer:default

# Node group IAM role (if it exists)
terraform import 'module.eks.module.eks_managed_node_group.aws_iam_role.this["default"]' writing-analyzer-eks-cluster-role
```

## After Import

Run `terraform plan` to verify. Terraform should show no changes (or only minor drift) for the imported resources.
