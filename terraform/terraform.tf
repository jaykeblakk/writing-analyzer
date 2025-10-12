terraform {
  cloud {
    organization = "Personal-HCP-Org"

    workspaces {
      project = "writing-analyzer"
      name = "writing-analyzer-prod"
    }
  }
}