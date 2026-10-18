CREATE OR REPLACE VIEW v_directory_websites AS

WITH website_stamp_counts AS (

    SELECT 
        website_id,
        COUNT(id) FILTER (WHERE stamp = 'GOLD') AS gold_stamps,
        COUNT(id) FILTER (WHERE stamp = 'SILVER') AS silver_stamps,
        COUNT(id) FILTER (WHERE stamp = 'BRONZE') AS bronze_stamps,
        COUNT(id) AS stamp_count
    FROM website_stamps
    GROUP BY website_id
),

website_declarations_counts AS (

    SELECT 
        website_id,
        COUNT(id) FILTER (WHERE status = 'CONFORM') AS conform_declarations,
        COUNT(id) FILTER (WHERE status = 'PARTIALLY_CONFORM') AS partially_conform_declarations,
        COUNT(id) FILTER (WHERE status = 'NON_CONFORM') AS non_conform_declarations,
        COUNT(id) AS declarations_count
    FROM website_declarations
    GROUP BY website_id
),
directory_mapping AS (

    SELECT 
        d.id,
        d.name,
        d.tag_matching_strategy,
        d.is_in_observatory,
        wt.website_id
    FROM directories d
    INNER JOIN directory_tags dt ON dt.directory_id = d.id
    INNER JOIN website_tags wt ON wt.tag_id = dt.tag_id
    GROUP BY d.id, d.name, d.tag_matching_strategy, d.is_in_observatory, wt.website_id
)

SELECT 
    dm.id,
    dm.name,
    dm.tag_matching_strategy,
    dm.is_in_observatory,
    ARRAY_AGG(dm.website_id) AS website_ids,
    CARDINALITY(ARRAY_AGG(dm.website_id)) AS website_count,
    SUM(COALESCE(wsc.stamp_count, 0)) AS total_stamps,
    SUM(COALESCE(wsc.gold_stamps, 0)) AS total_gold_stamps,
    SUM(COALESCE(wsc.silver_stamps, 0)) AS total_silver_stamps,
    SUM(COALESCE(wsc.bronze_stamps, 0)) AS total_bronze_stamps,
   SUM(COALESCE(wdc.declarations_count, 0)) AS total_declarations,
    SUM(COALESCE(wdc.conform_declarations, 0)) AS total_conform_declarations,
    SUM(COALESCE(wdc.partially_conform_declarations, 0)) AS total_partiallyconform_declarations,
    SUM(COALESCE(wdc.non_conform_declarations, 0)) AS total_nonconform_declarations
FROM directory_mapping dm
LEFT JOIN website_stamp_counts wsc ON wsc.website_id = dm.website_id
LEFT JOIN website_declarations_counts wdc ON wdc.website_id = dm.website_id
GROUP BY dm.id, dm.name, dm.tag_matching_strategy, dm.is_in_observatory;
