# AI Usage Documentation (AI_USAGE.md)

This document fulfils the project requirement for transparent documentation of AI tool usage throughout the Software Development Life Cycle (SDLC), as per User Story 4.5 (Ethical AI Usage).

---

## Overview

AI assistance was used at specific, well-defined stages of this project. All AI-generated content was reviewed, tested, and validated by the development team before inclusion. No AI-generated code was accepted blindly.

---

## Where AI Was Used

### 1. Requirements Analysis

- **Tool**: Claude
- **Usage**: Helped decompose user stories into concrete technical tasks and identify missing edge cases (e.g., cart clearing on restaurant switch, order count threshold for "mostly ordered").
- **Human review**: All generated task breakdowns were reviewed against the original user story document.

### 2. Boilerplate Code Generation

- **Usage**: Generated initial boilerplate for:
  - Spring Boot entity classes (`@Entity`, `@Data`, `@Builder`)
  - React context providers (AuthContext, CartContext)
- **Human review**: All boilerplate was reviewed for correctness and adapted to project-specific requirements (field names, relationships, role logic).

### 3. Test Generation

- **Usage**: Generated the skeleton of MockMvc integration tests. Test scenarios were specified by the developer; AI produced the assertion syntax and setup/teardown structure.
- **Human review**: All 15 tests were run and verified to pass. Test logic was reviewed to confirm each test exercises the correct behaviour.

### 4. API Documentation

- **Usage**: Suggested `@Operation`, `@Tag`, and `@SecurityRequirement` annotations for Swagger/OpenAPI documentation.
- **Human review**: Swagger UI was opened and verified at `/swagger-ui.html` to confirm all endpoints were visible and correctly described.

### 5. README Writing

- **Usage**: Initial draft of this README and the AI_USAGE.md were produced with AI assistance.
- **Human review**: Content was reviewed for accuracy against the actual project structure and commands.

---

## Where AI Was NOT Used

- **Business logic decisions** (e.g., what constitutes "mostly ordered", status flow Pending → Preparing → Ready → Completed) — decided by the development team.
- **Database schema design** — entity relationships and table structure were designed manually.
- **User story acceptance criteria interpretation** — done independently before any AI assistance.
- **Final submission review and testing** — all tests were run and deployment was verified by the development team.

## Tools Used

| Tool               | Version    | Purpose                                         |
| ------------------ | ---------- | ----------------------------------------------- |
| Claude (Anthropic) | Sonnet 4.x | Code assistance, documentation, test generation |

---
