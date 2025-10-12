provider "aws" {
  region = "us-west-2"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.19.0"

  name = "writing-project-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-west-2a", "us-west-2b", "us-west-2c"]
  private_subnets = ["10.0.1.0/24"]
  public_subnets  = ["10.0.101.0/24"]

  enable_dns_hostnames    = true
}

module "eks" {
    source = "terraform-aws-modules/eks/aws"
    version = "20.8.5"
    cluster_name = "writing_analyzer_cluster"
    cluster_version = "1.29"
    cluster_endpoint_public_access = true
    enable_cluster_creator_admin_permissions = true
    vpc_id     = module.vpc.vpc_id
    subnet_ids = module.vpc.private_subnets
    eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"

    }
    eks_managed_node_groups = {
        one = {
            name = "node-group-1"
            instance_types = ["t2.micro"]
            min_size = 1
            max_size = 2
            desired_size = 1
        }
    }
}