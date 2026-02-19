module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name                                     = var.cluster_name
  kubernetes_version                        = var.cluster_version
  endpoint_public_access                    = true
  enable_cluster_creator_admin_permissions = true

  # EKS Auto Mode - AWS manages compute, networking, storage
  # general-purpose uses smallest compliant instances (t3a.medium, t3.medium, m5.large, etc.)
  compute_config = {
    enabled    = true
    node_pools = ["general-purpose"]
  }

  access_entries = {
    for i, arn in var.cluster_admin_principal_arns : "admin-${i}" => {
      principal_arn = arn
      type          = "STANDARD"
      policy_associations = {
        admin = {
          policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = { type = "cluster" }
        }
      }
    }
  }

  addons = {
    vpc-cni = {
      most_recent    = true
      before_compute = true
    }
    coredns = {
      most_recent = true
    }
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  tags = local.tags
}
