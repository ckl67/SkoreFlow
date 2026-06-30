# Frontend Architecture flow

## Entry points Flow

Gives just a short overview of the entry points.
See also that **AuthProvider.tsx** is the central authentication component !

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


%% Class application

class TOPNAVBAR,SIDENAVBAR,OUTLET component;
class login,logout,refreshMe,useAuth function;
```

## Architecture

````mermaid
graph TD

%% UI LAYER
UI["UI Layer"]
PAGES["Pages"]
COMP["Components"]
LAYOUT["Layout"]

%% ROUTING
ROUTER["Router Layer"]
ROUTER_FILE["router.tsx"]

%% STATE
STATE["State Layer"]
AUTH["AuthProvider"]
USEAUTH["useAuth"]

%% SERVICES
SERVICES["Services Layer"]
AUTH_SVC["authService"]
USER_SVC["userService"]

%% API
API["api/client.ts"]
BACKEND["Backend API"]

%% FLOW
UI --> PAGES
UI --> COMP
UI --> LAYOUT

ROUTER --> ROUTER_FILE
PAGES --> ROUTER

STATE --> AUTH
STATE --> USEAUTH

PAGES --> SERVICES
SERVICES --> API
API --> BACKEND

STATE --> UI
```
````
