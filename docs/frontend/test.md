# Frontend Architecture flow

## Convention

| Type                           | Convention              |
| ------------------------------ | ----------------------- |
| Component React                | PascalCase              |
| Hook                           | camelCase with `use`    |
| Function                       | camelCase               |
| Utility Files                  | camelCase               |
| Entry Point of the application | low case (Ex: main.tsx) |

## Main Flow

See that **AuthProvider.tsx** is the central authentication component !

```mermaid
graph TD

%% ClassDef
classDef file fill:#f3f4f6,stroke:#6b7280;
classDef component fill:#deafe,stroke:#2563eb;
classDef function fill:#fef3c7,stroke:#d97706;



%% html entry : point
INDEX["📄 index.html"]

%% react entry point : main.tsx
MAIN["📄 main.tsx <br/> <small> entry point</small>  <br/> src/main.tsx"]
AUTH["📄 AuthProvider.tsx <br/>  src/auth/AuthProvider.tsx"]
ROUTER["📄 router.tsx <br> <small> entry point</small>  <br/> src/router/router.tsx"]

INDEX --> MAIN
MAIN --> AUTH
AUTH --> ROUTER

%% First element in router : MainLayout
MAINLAYOUT["📄 MainLayout.tsx <br> src/layout/MainLayout.tsx"]

ROUTER --> MAINLAYOUT

%% In MainLayout
TOPNAVBAR["📄TopNavbar <br>  src/components/TopNavbar.tsx"]

SIDENAVBAR["📄 SideNavbar <br> src/components/SideNavbar.tsx"]

%% Then rest of the route to OUTLET
OUTLET["Main page <br> Outlet <br> <small>routes from router.tsx"<small>]

%% DevPanel
DEVPANEL["📄 DevPanel <br> src/dev/DevPanel.tsx"]

MAINLAYOUT --> TOPNAVBAR
MAINLAYOUT --> SIDENAVBAR
MAINLAYOUT --> DEVPANEL
MAINLAYOUT --> OUTLET

ROUTER --> |/login <br> /register <br> /me <br> ...| OUTLET

%%

TOPNAVBAR --> |login| END1["."]
TOPNAVBAR --> AVATARMENU["AvatarMenu() "]

SIDENAVBAR-->|profile| END2["."]
SIDENAVBAR-->/admin

%% Class application

class TOPNAVBAR,SIDENAVBAR,OUTLET component;

class login,logout,refreshMe,useAuth function;

```

## Authentication Flow

AuthProvider is the central authentication component.

It exposes:

- login()
- logout()
- refreshMe()
- useAuth()
-

```mermaid


graph TD

AUTH["AuthProvider.tsx"]

AUTH --> LOGIN["login()"]
AUTH --> LOGOUT["logout()"]
AUTH --> REFRESH["refreshMe()"]
AUTH --> HOOK["useAuth()"]

```
