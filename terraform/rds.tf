resource "aws_db_subnet_group" "main" {
  name       = "writing-analyzer-db-subnet"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "writing-analyzer-db-subnet"
  }
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.13.0"

  identifier = "writing-analyzer-db"

  # Engine options
  engine               = "postgres"
  engine_version       = "16.3"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.t3.micro"

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  # Database name and credentials
  db_name  = "writing_analyzer"
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup and maintenance
  backup_retention_period = 7
  backup_window          = "03:00-06:00"
  maintenance_window     = "Mon:00:00-Mon:03:00"

  # Deletion protection
  deletion_protection = false
  skip_final_snapshot = true

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  # Performance Insights
  performance_insights_enabled = false

  tags = {
    Name        = "writing-analyzer-db"
    Environment = "production"
  }
}