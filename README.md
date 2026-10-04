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
## Evaluation Processing 
```mermaid
graph LR
    subgraph IngestionLayer [Triggers & Ingestion]
        APIRequest((HTTP API / Client Request))
        OutboxPoller((Outbox Poller / Cron))
    end

    subgraph Infrastructure [Data & Storage Tier]
        StorageDrive[(Storage Drive / S3 Bucket)]
        Postgres[(PostgreSQL Database)]
        Redis[(Redis Streams / PubSub)]
    end

    subgraph EvalQueueWorker [Evaluation Queue Worker]
        EvalQueue((Evaluation Queue))
        EvalWorker((Evaluation Worker))
        EvaluateAction((Compute Evaluation))
        EvalRetry((Backoff & Retry))
        EvalDLQ((Evaluation DLQ))
        EvalSuccess((Success State))
    end

    subgraph PersistQueueWorker [Persistence Queue Worker]
        PersistQueue((Persistence Queue))
        PersistWorker((Persistence Worker))
        PersistHydrate((Hydrate Payload))
        PersistDB((Commit DB Transaction))
        PersistRetry((Backoff & Retry))
        PersistDLQ((Persistence DLQ))
        PersistSuccess((Success State))
    end

    %% Pipeline 1: Evaluation Flow
    APIRequest -->|Enqueue Job| EvalQueue
    EvalQueue -->|Consume| EvalWorker
    
    EvalWorker -->|1 Compute| EvaluateAction
    EvalWorker -->|2 Claim-Check Payload| StorageDrive
    EvalWorker -->|3 Outbox Event| Postgres

    EvalWorker -->|Job Error / Max Retries Reached| EvalRetry
    EvalWorker -->|Execution Complete| EvalSuccess
    
    EvalRetry -->|Re-queue Under Max Attempts| EvalQueue
    EvalRetry -->|Exhausted Attempts| EvalDLQ

    %% Pipeline 2: Persistence Flow
    OutboxPoller -->|Dispatch Job| PersistQueue
    PersistQueue -->|Consume| PersistWorker
    
    PersistWorker -->|1 Fetch Payload| StorageDrive
    PersistWorker -->|2 Process Data| PersistHydrate
    PersistWorker -->|3 Store Compressed HTML & JSON| StorageDrive
    PersistWorker -->|4 Update Status| PersistDB
    PersistWorker -->|5 Publish Evaluation Metrics| Redis
    Redis -->|6 Append Stream Event| PersistWorker

    PersistWorker -->|Job Error / Max Retries Reached| PersistRetry
    PersistWorker -->|Execution Complete| PersistSuccess

    PersistRetry -->|Re-queue Under Max Attempts| PersistQueue
    PersistRetry -->|Exhausted Attempts| PersistDLQ
```
## Evaluation Data Ingestion
```mermaid
graph TD
    %% Ingestion
    Input[Data Sources] --> RedisStream[Redis Stream]

    subgraph Ingestion_Layer [Ingestion Layer]
        RedisStream --> |Consume| Batch[Batch Consumer]
        Batch --> |"ACK/XACK"| RedisStream
        RedisStream --> |"Recurrent Fail"| DLQ[Dead Letter Queue]
    end
    subgraph ClickhouseDB[ Clickhouse DB]
    Batch --> LogTable[Source of Truth - Evaluations]
    
    %% Transformation
    LogTable -->|"Materialized View Triggers"| MVs[Snapshots MVs]
    
    subgraph Snapshots [Materialized Snapshots]
        Global[Global]
        Web[Websites]
        Pag[Pages]
        Dir[Directories]
        Ent[Institutions]
    end
    
    MVs --> Global & Web & Pag & Dir & Ent
    end
    %% Query
    Global & Web & Pag & Dir & Ent --> Consult[Analytics API - Read Optimized]

   ```
