resource "aws_ecr_repository" "backend" {
  name                 = "writing-analyzer-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "writing-analyzer-backend"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "writing-analyzer-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "writing-analyzer-frontend"
  }
}