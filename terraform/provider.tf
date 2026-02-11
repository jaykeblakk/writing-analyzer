provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.15.0"
    }
  }

  required_version = ">= 1.5.7"
}