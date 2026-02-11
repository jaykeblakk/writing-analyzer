variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "writing-analyzer"
}

variable "cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.35"
}

variable "cluster_admin_principal_arns" {
  description = "List of IAM principal ARNs (users or roles) to grant cluster admin access. Set in HCP Terraform - e.g. arn:aws:iam::ACCOUNT_ID:user/username"
  type        = list(string)
  default     = []
}
