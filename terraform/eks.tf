module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.5"

  cluster_name                             = "writing_analyzer_cluster"
  cluster_version                          = "1.34"
  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true

  # Use custom IAM role for cluster
  iam_role_arn = aws_iam_role.eks_cluster.arn
  create_iam_role = false

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Attach security group to nodes
  cluster_security_group_additional_rules = {
    ingress_nodes_ephemeral_ports_tcp = {
      description                = "Nodes on ephemeral ports"
      protocol                   = "tcp"
      from_port                  = 1025
      to_port                    = 65535
      type                       = "ingress"
      source_node_security_group = true
    }
  }

  eks_managed_node_group_defaults = {
    ami_type       = "AL2023_x86_64_STANDARD"
    instance_types = ["t2.micro"]
    
    # Use custom IAM role for nodes
    iam_role_arn        = aws_iam_role.eks_nodes.arn
    create_iam_role     = false
    
    # Attach EKS nodes security group
    vpc_security_group_ids = [aws_security_group.eks_nodes.id]
  }

  eks_managed_node_groups = {
    one = {
      name         = "node-group-1"
      min_size     = 1
      max_size     = 2
      desired_size = 1

      labels = {
        Environment = "production"
        Application = "writing-analyzer"
      }

      tags = {
        Name = "writing-analyzer-node-group-1"
      }
    }
  }

  tags = {
    Environment = "production"
    Application = "writing-analyzer"
  }
}

