---
id: service-tree
title: Service Tree (LPSM)
---

# Service Tree (LPSM)

This document describes the Service Tree (LPSM) naming conventions used across AtomiCloud.

## Overview

All products and applications' resources in AtomiCloud are confined within the **Service Tree**. This allows easy querying, classification, and data retrieval about resources of a specific product.

## Format

- **LCPSM** (Tech-Specific) - includes Cluster for Kubernetes
- **LPSM** (Domain) - C is often omitted as it's Kubernetes-specific metadata

## The Hierarchy

| Level | Name      | Description                                            | Theme Set                 |
| ----- | --------- | ------------------------------------------------------ | ------------------------- |
| **L** | Landscape | Deployment environment (purpose, region, segment)      | Pokemon                   |
| **C** | Cluster   | Kubernetes cluster within a Landscape                  | Gemstones                 |
| **P** | Platform  | Single product/namespace (target segment, app, domain) | Functional Groups         |
| **S** | Service   | API/application, usually one git repo + helm chart     | Elements (Periodic Table) |
| **M** | Module    | Actual components (databases, API, caches, etc.)       | Free-form                 |

## Landscape (L) - Pokemon Theme

Encodes: **Purpose, Region, Segment**

| Pokemon Type     | Environment         |
| ---------------- | ------------------- |
| Legendary        | Meta/Administration |
| First Evolution  | Development         |
| Second Evolution | Staging/UAT         |
| Final Evolution  | Production          |
| Non-Evolution    | Local/Testing       |

### Examples

- `pichu` - Development (First Evolution)
- `pikachu` - Staging (Second Evolution)
- `raichu` - Production (Final Evolution)

## Cluster (C) - Gemstone Theme

- Unique within a single Landscape
- Enables blue-green deployments and fallback clusters
- Allows cluster switching without affecting other labels

### Examples

- `diamond`, `ruby`, `sapphire`, `emerald`

## Platform (P) - Functional Group Theme

- Represents a single product as a namespace
- Business perspective: same target segment, single app, or single domain

### Examples

- `sulfoxide` - System services
- `halogen` - Business services
- `noble-gas` - Infrastructure services

## Service (S) - Element Theme (Periodic Table)

- Normal services: loosely follow element mappings
- Sulfoxide (System) services: strict element mapping

### Examples

- `hydrogen` (H) - Lightweight/base service
- `carbon` (C) - Core service
- `iron` (Fe) - Strong/stable service

## Module (M) - Free-form

- No theme restrictions
- Sub-components of a service

### Examples

- `api`, `worker`, `database`, `cache`, `queue`

## The Metaphor

> Each Pokemon (landscape) wears gemstones (cluster) consisting of functional groups (platform) which are made of elements (service) which are made of sub-atomic particles (module)

## Where LPSM is Used

### Resource Naming

- Kubernetes resources: `{l}-{c}-{p}-{s}-{m}`
- Cloud resources: Include LPSM components

### Labels and Tags

```yaml
labels:
  landscape: pichu
  cluster: diamond
  platform: sulfoxide
  service: hydrogen
  module: api
```

### Repository Naming

- `{service}.git` - Service repositories
- `{platform}.git` - Platform monorepos (if applicable)

### Cache Namespacing

```yaml
nscloud-cache-tag-{platform}-{service}-nix-store-cache
```

Example: `nscloud-cache-tag-sulfoxide-hydrogen-nix-store-cache`

### CI/CD Inputs

```yaml
atomi_platform: sulfoxide
atomi_service: hydrogen
```

### Helm Chart Values

```yaml
global:
  lpsm:
    landscape: pichu
    cluster: diamond
    platform: sulfoxide
    service: hydrogen
```

## Trigger Words

When you see these terms, the service-tree convention applies:

- LPSM, LCPSM, Service Tree
- Landscape, Platform, Service, Module
- Resource naming, labeling, tagging
- `atomi_platform`, `atomi_service` variables
- Cache namespacing

## Summary

| Aspect        | Pattern                                |
| ------------- | -------------------------------------- |
| **Format**    | L-C-P-S-M (LCPSM) or L-P-S-M (LPSM)    |
| **Landscape** | Pokemon theme (environment)            |
| **Cluster**   | Gemstone theme                         |
| **Platform**  | Functional group theme                 |
| **Service**   | Element theme (periodic table)         |
| **Module**    | Free-form                              |
| **Cache key** | `{platform}-{service}-nix-store-cache` |
