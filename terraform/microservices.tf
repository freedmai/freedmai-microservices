# ECR Repositories for all microservices
resource "aws_ecr_repository" "microservices" {
  for_each = toset([
    "freedmai-api-gateway",
    "freedmai-auth-service", 
    "freedmai-billing-service",
    "freedmai-payment-service",
    "freedmai-user-service",
    "freedmai-notification-service"
  ])

  name                 = each.key
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "microservices" {
  for_each = aws_ecr_repository.microservices

  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep last 5 untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# CloudWatch Log Groups for microservices
resource "aws_cloudwatch_log_group" "microservices" {
  for_each = toset([
    "api-gateway",
    "auth-service", 
    "billing-service",
    "payment-service",
    "user-service",
    "notification-service"
  ])

  name              = "/freedmai/${each.key}/${var.environment}"
  retention_in_days = 7

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Systems Manager Parameters for configuration
resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/freedmai/${var.environment}/jwt-secret"
  type  = "SecureString"
  value = "change-me-in-production"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ssm_parameter" "database_url" {
  name  = "/freedmai/${var.environment}/database-url"
  type  = "SecureString"
  value = "postgresql://user:pass@localhost:5432/freedmai"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Outputs
output "ecr_repositories" {
  value = {
    for k, v in aws_ecr_repository.microservices : k => v.repository_url
  }
}

output "log_groups" {
  value = {
    for k, v in aws_cloudwatch_log_group.microservices : k => v.name
  }
}
