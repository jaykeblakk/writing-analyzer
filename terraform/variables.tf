variable "vpc_name" {
    description = "Value of the VPC's name tag"
    type = string
    default = "writing-project-vpc"
}

variable "vpc_cidr" {
    description = "CIDR block for VPC"
    type = string
    default = "10.0.0.0/16"
}

variable "vpc_azs" {
    description = "Availability zones for VPC"
    type = list(string)
    default = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "vpc_private_subnets" {
    description = "Private subnet CIDR blocks"
    type = list(string)
    default = ["10.0.1.0/24"]
}

variable "vpc_public_subnets" {
    description = "Public subnet CIDR blocks"
    type = list(string)
    default = ["10.0.101.0/24"]
}

variable "vpc_enable_dns_hostnames" {
    description = "Enable DNS hostnames in VPC"
    type = bool
    default = true
}

# RDS Database Variables
variable "db_username" {
    description = "Master username for RDS database"
    type        = string
    default     = "postgres"
    sensitive   = true
}

variable "db_password" {
    description = "Master password for RDS database"
    type        = string
    sensitive   = true
}