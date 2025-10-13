# Security group for EKS nodes
resource "aws_security_group" "eks_nodes" {
  name        = "writing-analyzer-eks-nodes-sg"
  description = "Security group for EKS worker nodes"
  vpc_id      = module.vpc.vpc_id

  # Allow nodes to communicate with each other
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  # Allow nodes to communicate with the internet
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "writing-analyzer-eks-nodes-sg"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "writing-analyzer-rds-sg"
  description = "Security group for RDS PostgreSQL database"
  vpc_id      = module.vpc.vpc_id

  # Allow outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "writing-analyzer-rds-sg"
  }
}

resource "aws_security_group_rule" "eks_to_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.rds.id
}

resource "aws_security_group_rule" "rds_from_eks" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.eks_nodes.id
}

