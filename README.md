<div align="center">
  <!--<a href="https://github.com/izaz4141/Kantsusha">
    <img src="assets/icons/nadeko-don-1024.png" alt="Nadeko~don Logo" width="150">
  </a>-->
  <h3>Kantsusha</h3>
  <p>A Flexible, Customizable Dashboard</p>
  <p>
    <a href="https://github.com/izaz4141/Kantsusha/releases"><img src="https://img.shields.io/github/v/release/izaz4141/Kantsusha?style=for-the-badge&labelColor=101418&color=9ccbfb" alt="GitHub release"></a>
    <a href="https://github.com/izaz4141/Kantsusha/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/izaz4141/Kantsusha?style=for-the-badge&labelColor=101418&color=b9c8da" alt="GitHub License"></a>
    <a href="https://github.com/izaz4141/Kantsusha/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/izaz4141/Kantsusha/build.yml?branch=main&style=for-the-badge&labelColor=101418&label=BUILD" alt="Build Status"></a>
  </p>
  
  <p>
    <a href="#features">Features</a> •
    <a href="docs">Documentation</a> 
  </p>
</div>

## Features

- **Widget system**: Config-driven widgets with LRU cache and background refresh
- **Themes**: Customizable through config.yaml
- **SQLite database**: Drizzle ORM with better-auth integration
- **Authentication**: better-auth integration

## Tech Stack

- SvelteKit (Svelte 5)
- Tailwind CSS
- Bun runtime
- drizzle + libSQL
- better-auth

## Bugs

- Annoying bug where after a while any fetch wouldn't work (could be Bun's bug)

## Notes

Largely inspired by [glanceapp/glance](https://github.com/glanceapp/glance).
