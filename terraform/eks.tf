module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.8.0"
  kubernetes_version = "1.34"

  name                   = "test-cluster"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.public_subnets

  enable_cluster_creator_admin_permissions = true

  eks_managed_node_groups = {
    test-cluster-wg = {
      min_size     = 1
      max_size     = 2
      desired_size = 1
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["t3.micro"]
      capacity_type  = "SPOT"
      attach_cluster_primary_security_group = true

      tags = {
        ExtraTag = "testtag"
      }
    }
  }
}