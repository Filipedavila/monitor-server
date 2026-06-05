

DROP TABLE IF EXISTS evaluations_tests;
CREATE TABLE evaluations_tests (

	evaluationId UInt64 CODEC(T64,LZ4),
	directoryId UInt32 CODEC(T64,LZ4),
	websiteId  UInt32 CODEC(T64,LZ4),
	page_id  UInt32 CODEC(T64,LZ4),
	entity_id UInt32 CODEC(T64,LZ4),
	evaluationDate DateTime,
	rule_code LowCardinality(String),	
    results Tuple(
        passed UInt32, 
        failed UInt32, 
        warning UInt32
    ),		
    score Float32 CODEC(ZSTD(1))
) ENGINE = MergeTree() 
ORDER BY (rule_code, directoryID, websiteId, page_id, evaluationDate);

-- needs to be defined best Order By for use cases.
-- cardinality rule_code (170) , directoryID(1 - 50)  websiteId( 1 - 49999)  page_id(1  - 1000)  evaluationDate (n)
