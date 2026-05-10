terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Resource Group
resource "azurerm_resource_group" "foodlytics" {
  name     = "rg-foodlytics"
  location = "East US"
}

# 2. Container Registry (ACR)
resource "azurerm_container_registry" "acr" {
  name                = "acrfoodlytics123" # Must be globally unique
  resource_group_name = azurerm_resource_group.foodlytics.name
  location            = azurerm_resource_group.foodlytics.location
  sku                 = "Basic"
  admin_enabled       = true
}

# 3. Log Analytics (Required for Container Apps)
resource "azurerm_log_analytics_workspace" "logs" {
  name                = "log-foodlytics"
  location            = azurerm_resource_group.foodlytics.location
  resource_group_name = azurerm_resource_group.foodlytics.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# 4. Container App Environment
resource "azurerm_container_app_environment" "env" {
  name                       = "env-foodlytics"
  location                   = azurerm_resource_group.foodlytics.location
  resource_group_name        = azurerm_resource_group.foodlytics.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

# 5. Container App (The Backend)
resource "azurerm_container_app" "backend" {
  name                         = "ca-foodlytics-backend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.foodlytics.name
  revision_mode                = "Single"

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.acr.login_server}/backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "SUPABASE_URL"
        value = "your_supabase_url"
      }
      env {
        name  = "SUPABASE_KEY"
        value = "your_supabase_key"
      }
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name  = "registry-password"
    value = azurerm_container_registry.acr.admin_password
  }

  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "registry-password"
  }
}

output "backend_url" {
  value = azurerm_container_app.backend.latest_revision_fqdn
}
