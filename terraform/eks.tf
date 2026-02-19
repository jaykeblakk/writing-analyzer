module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name                                     = var.cluster_name
  kubernetes_version                        = var.cluster_version
  endpoint_public_access                    = true
  enable_cluster_creator_admin_permissions = true

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

  eks_managed_node_groups = {
    default = {
      ami_type             = "AL2023_x86_64_STANDARD"  # Required for 1.35; AL2 AMIs deprecated
      instance_types       = ["t3.small"]
      use_name_prefix      = false
      iam_role_name        = "writing-analyzer-eks-node"
      iam_role_use_name_prefix = false

      min_size     = 1
      max_size     = 2
      desired_size = 1

      update_config = {
        max_unavailable_percentage = 50
      }
    }
  }

  tags = local.tags
}
