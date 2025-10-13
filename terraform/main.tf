terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  cloud {
    organization = "Personal-HCP-Org"

    workspaces {
      project = "writing-analyzer"
      name = "writing-analyzer-prod"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}