DROP VIEW IF EXISTS v_institution_websites;
CREATE OR REPLACE VIEW v_institution_websites AS

SELECT 
    i.id AS institution_id,
    i.long_name AS institution_name,
    w.id AS website_id,
    w.title AS website_title,
    w.base_url,
    ws.stamp,                 
    wd.status AS declaration_status,
    w.is_in_observatory AS is_in_observatory
FROM websites w
LEFT JOIN institutions i ON i.id = w.institution_id
LEFT JOIN website_stamps ws ON ws.website_id = w.id
LEFT JOIN website_declarations wd ON wd.website_id = w.id;






















CREATE OR REPLACE VIEW v_institution_websites AS
WITH DirectoryRequirements AS (
    SELECT 
        d.id AS directory_id,
        d.tag_matching_strategy,
        COUNT(dt.tag_id) AS required_tags_count
    FROM directories d
    JOIN directory_tags dt ON dt.directory_id = d.id
    GROUP BY d.id, d.tag_matching_strategy
),
WebsiteDirectoryMatches AS (
    SELECT 
        wt.website_id,
        dr.directory_id
    FROM website_tags wt
    JOIN directory_tags dt ON dt.tag_id = wt.tag_id
    JOIN DirectoryRequirements dr ON dr.directory_id = dt.directory_id
    GROUP BY wt.website_id, dr.directory_id, dr.tag_matching_strategy, dr.required_tags_count
    HAVING 
        (dr.tag_matching_strategy = 'UNION')
        OR 
        (dr.tag_matching_strategy = 'INTERSECTION' AND COUNT(DISTINCT wt.tag_id) = dr.required_tags_count)
),
AggregatedDirectories AS (

    SELECT 
        website_id,
        ARRAY_AGG(directory_id) AS directories_ids
    FROM WebsiteDirectoryMatches
    GROUP BY website_id
)
SELECT 
    w.id AS website_id,
    w.title AS website_title,
    w.base_url,
    i.id AS institution_id,
    i.long_name AS institution_name,
    i.id AS institution_id,
    COALESCE(ad.directories_ids, ARRAY[]::INTEGER[]) AS directories_ids
FROM websites w
LEFT JOIN AggregatedDirectories ad ON ad.website_id = w.id
LEFT JOIN website_stamps ws ON ws.website_id = w.id
LEFT JOIN website_declarations wd ON wd.website_id = w.id
LEFT JOIN institutions i ON i.id = w.institution_id
LEFT JOIN website_contexts wc ON wc.website_id = w.id AND wc.context_id = 3;




CREATE OR REPLACE VIEW v_app_counters AS
SELECT 
    entity_type,
    total_count
FROM entity_counters;