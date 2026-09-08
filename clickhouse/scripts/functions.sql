CREATE OR REPLACE VIEW v_top_3_websites AS
WITH
    flattened_dirs AS
    (
        SELECT
            id AS directory_id,
            name AS directory_name,
            wid AS website_id
        FROM dictionary('accessibility.directories_metadata_dict')
        ARRAY JOIN website_ids AS wid
    ),
    latest_quarter_data AS
    (
        SELECT
            website_id AS id,
            avgMerge(avg_score) AS final_score
        FROM website_snapshots_statistics
        WHERE quarter_start = (SELECT max(quarter_start) FROM website_snapshots_statistics)
        GROUP BY website_id
    ),
    top_n_raw AS
    (
        SELECT
            id,
            final_score AS max_score
        FROM latest_quarter_data
        ORDER BY
            max_score DESC,
            id ASC
        LIMIT 3
    )
SELECT groupArray(map(
    'index', toUInt64(rank),
    'id', toUInt64(id),
    'directoryId', toUInt64(ifNull(directory_id, 0)),
    'entity', ifNull(entity, ''),
    'name', ifNull(directory_name, ''),
    'score', toFloat64(max_score)
)) AS topWebsites
FROM
(
    SELECT
        t.id,
        t.max_score,
        ROW_NUMBER() OVER (ORDER BY t.max_score DESC, t.id ASC) AS rank,
        dir.directory_id,
        dir.directory_name,
        dictGet('accessibility.websites_metadata_dict', 'institution_name', t.id) AS entity
    FROM top_n_raw AS t
    LEFT JOIN flattened_dirs AS dir ON t.id = dir.website_id
);







SELECT
    avgMerge(G.avg_score) AS score,
    (SELECT min(evaluation_date) FROM evaluations) AS oldestPageDate,
    (SELECT max(evaluation_date) FROM evaluations) AS recentPageDate,
    (SELECT count(Distinct evaluation_id) FROM evaluations) AS totalEvaluations,
    (
        SELECT count(DISTINCT website_id) FROM evaluations
    ) AS totalWebsites,
    (
        SELECT count(DISTINCT page_id) FROM evaluations
    ) AS totalPages,
    -- Top 10 Failed Rules com a estrutura de objetos desejada
    ( SELECT * FROM v_top_3_websites ) AS top_3_websites,
    (
        SELECT arraySlice(arraySort(x -> -toInt64(x['occurrenceCount']), groupArray(map(
            'key', rule_id,
            'occurrenceCount', toUInt64(total_occ),
            'pagesCount', toUInt64(total_pages),
            'websitesCount', toUInt64(total_websites)
        ))), 1, 10)
        FROM (
            SELECT 
                rule_id, 
                sum(occurrence_count) AS total_occ,
                groupBitmapMerge(pages_count) AS total_pages,
                groupBitmapMerge(websites_count) AS total_websites
            FROM global_rules_top_summary
            WHERE rule_result = 'failed'
            GROUP BY rule_id
        )
    ) AS top_10_failed,
    
    -- Top 10 Passed Rules com a estrutura de objetos desejada
    (
        SELECT arraySlice(arraySort(x -> -toInt64(x['occurrenceCount']), groupArray(map(
            'key', rule_id,
            'occurrenceCount', toUInt64(total_occ),
            'pagesCount', toUInt64(total_pages),
            'websitesCount', toUInt64(total_websites)
        ))), 1, 10)
        FROM (
            SELECT 
                rule_id, 
                sum(occurrence_count) AS total_occ,
                groupBitmapMerge(pages_count) AS total_pages,
                groupBitmapMerge(websites_count) AS total_websites
            FROM global_rules_top_summary
            WHERE rule_result = 'passed'
            GROUP BY rule_id
        )
    ) AS top_10_passed

FROM global_snapshots_statistics G
FORMAT JSON;



CREATE OR REPLACE VIEW v_global_rules_ranking AS
SELECT 
    arraySlice(arraySort(x -> -toInt64(x['occurrenceCount']), groupArrayIf(map(
        'key', rule_id,
        'occurrenceCount', toUInt64(total_occ),
        'pagesCount', toUInt64(total_pages),
        'websitesCount', toUInt64(total_websites)
    ), rule_result = 'failed')), 1, 10) AS top_10_failed,
    
    arraySlice(arraySort(x -> -toInt64(x['occurrenceCount']), groupArrayIf(map(
        'key', rule_id,
        'occurrenceCount', toUInt64(total_occ),
        'pagesCount', toUInt64(total_pages),
        'websitesCount', toUInt64(total_websites)
    ), rule_result = 'passed')), 1, 10) AS top_10_passed
FROM (
    SELECT 
        rule_id,
        rule_result,
        sum(occurrence_count) AS total_occ,
        groupBitmapMerge(pages_count) AS total_pages,
        groupBitmapMerge(websites_count) AS total_websites
    FROM global_rules_top_summary
    GROUP BY rule_id, rule_result
);


CREATE OR REPLACE VIEW v_global_dashboard_summary AS
SELECT
    (SELECT avgMerge(avg_score) FROM global_snapshots_statistics) AS score,
    (SELECT min(evaluation_date) FROM evaluations) AS oldestPageDate,
    (SELECT max(evaluation_date) FROM evaluations) AS recentPageDate,
    (SELECT uniqMerge(count_evals) FROM global_snapshots_statistics) AS totalEvaluations,
    (SELECT groupBitmapMerge(websites_count) FROM global_rules_top_summary) AS totalWebsites,
    (SELECT groupBitmapMerge(pages_count) FROM global_rules_top_summary) AS totalPages,
    (SELECT topWebsites FROM v_top_3_websites) AS top_3_websites



FORMAT JSON;


CREATE OR REPLACE VIEW v_rules_global_top_summary AS
SELECT
    groupArrayIf(
        map(
            'key', rule_id,
            'occurrenceCount', toUInt64(total_occ),
            'pagesCount', toUInt64(total_pages),
            'websitesCount', toUInt64(total_websites)
        ),
        rule_result = 'failed'
    ) AS top_5_failed,

    groupArrayIf(
        map(
            'key', rule_id,
            'occurrenceCount', toUInt64(total_occ),
            'pagesCount', toUInt64(total_pages),
            'websitesCount', toUInt64(total_websites)
        ),
        rule_result = 'passed'
    ) AS top_5_passed
FROM
(
    SELECT
        rule_id,
        rule_result,
        sum(occurrence_count) AS total_occ,
        groupBitmapMerge(pages_count) AS total_pages,
        groupBitmapMerge(websites_count) AS total_websites
    FROM
    (
        SELECT rule_id, rule_result, occurrence_count, pages_count, websites_count
        FROM global_rules_top_summary
        WHERE rule_result IN ('failed', 'passed')
        ORDER BY occurrence_count DESC
        LIMIT 40

        UNION ALL

        SELECT rule_id, rule_result, occurrence_count, pages_count, websites_count
        FROM temp_rules_top_summary
        WHERE rule_result IN ('failed', 'passed')
        ORDER BY occurrence_count DESC
        LIMIT 40
    )
    GROUP BY rule_id, rule_result
    ORDER BY total_occ DESC
    LIMIT 5 BY rule_result
);
