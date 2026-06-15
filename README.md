# Monitor Server System

Bem-vindo ao repositório do Monitor Server System.

## Arquitetura
Para uma visão detalhada sobre o desenho do sistema, incluindo os contextos de negócio e a estrutura técnica de contêineres, consulta a nossa documentação oficial:

# System Architecture

## Level 1: Business Context
```mermaid
graph LR
    %% Actors
    User((Administrator))
    MyMonitorUser((MyMonitor User))
    StudyMonitorUser((StudyMonitor User))
    Observatory((Observatory Analytics Dashboard))
    %% External Systems
    TargetWeb[Websites/Applications]
    
    %% Monitor Server System
    MonitorSystem[("Monitor Server System")]

    %% Business Flows
    User -->|Define and Configure Users and Associated Websites| MonitorSystem
    User -->|Query and Generate Accessibility Evaluations for Websites/Apps| MonitorSystem
    User -->|Generate/Analyse Reports and Assign Quality Badges and Declarations| MonitorSystem
    MyMonitorUser -->|Manage their Websites and Accessibility Evaluations| MonitorSystem
    MyMonitorUser -->|Run and Consult Accessibility Evaluations on their Websites| MonitorSystem
    StudyMonitorUser -->|Analyze and Audit Permited Websites in Isolation for Studies Purposes| MonitorSystem   
    MonitorSystem -->|Evaluate and aggregate information and Audit| TargetWeb
    Observatory -->|Query and Analyze Aggregated Accessibility Data for Research and Insights| MonitorSystem
```
## Level 2: Container Architecture
```mermaid
graph TD
    %% Actors
    User((Administrator))
    MyMonitorUser((MyMonitor User))
    StudyMonitorUser((StudyMonitor User))
    Observatory((Observatory Analytics Dashboard))

    subgraph Monitor_System [Monitor Server System]
        API_SVC[API Service Container - NestJS]
        Worker_Svc[Evaluation Worker Container]
        Batch_Svc[Batch Processor Container]
        AuthZ[OpenFGA Container]
        
        subgraph Data_Storage [Data Storage]
            BullMQ[(Redis: BullMQ Jobs)]
            Stream[(Redis: Streams Buffer)]
            ClickHouse[(ClickHouse Database)]
            MYSQL[(MySQL Database)]
            FGA_DB[(OpenFGA MySQL Database)]
        end
    end

    %% Technical Flows
    User -->|HTTPS/REST| API_SVC
    MyMonitorUser -->|HTTPS/REST| API_SVC
    StudyMonitorUser -->|HTTPS/REST| API_SVC
    Observatory -->|HTTPS/REST| API_SVC
    
    %% Authorization
    API_SVC -->|Check Permissions| AuthZ
    AuthZ -->|Read Tuples| FGA_DB
    
    %% Job vs Stream Flows
    API_SVC -->|Enqueue Task| BullMQ
    BullMQ -->|Process Job| Worker_Svc
    Worker_Svc -->|Publish Log| Stream
    
    %% Analytical Processing
    Stream -->|Consumes from Stream| Batch_Svc
    Batch_Svc -->|Bulk Insert| ClickHouse
    Batch_Svc -->|ACK| Stream
    
    API_SVC -->|CRUD Operations| MYSQL
    API_SVC -->|OLAP Queries| ClickHouse
```