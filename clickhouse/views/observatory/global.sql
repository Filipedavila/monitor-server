-- ============================================================================
-- 1. VIEW TOP 3 WEBSITES 
-- ============================================================================
CREATE OR REPLACE VIEW v_top_3_global_websites AS
SELECT
    groupArray(
        CAST(
            tuple(
                rank,
                website_id,
                toUInt64(if(empty(meta.3), 0, meta.3[1])),
                meta.1,
                meta.2,
                avg_score,
                pagesWithoutErrorsA,
                pagesWithoutErrorsAA,
                pagesWithoutErrorsAAA,
                total_errors
            ),
            'Tuple(
                index UInt64,
                id UInt64,
                directoryId UInt64,
                entity String,
                name String,
                score Float64,
                pagesWithoutErrorsA UInt64,
                pagesWithoutErrorsAA UInt64,
                pagesWithoutErrorsAAA UInt64,
                totalErrors UInt64
            )'
        )
    ) AS topWebsites
FROM
(
    SELECT
        rowNumberInAllBlocks() + 1 AS rank,
        toUInt64(website_id) AS website_id,
        avg_score,
        pagesWithoutErrorsA,
        pagesWithoutErrorsAA,
        pagesWithoutErrorsAAA,
        total_errors,
        dictGetOrDefault(
            'institution_websites_dict',
            ('institution_name', 'website_title', 'directories_ids'),
            website_id,
            ('', '', [])
        ) AS meta
    FROM
    (
        SELECT
            website_id,
            toFloat64(avg(score)) AS avg_score,
            countIf(a_error_count = 0 AND aa_error_count > 0) AS pagesWithoutErrorsA,
            countIf(aa_error_count = 0 AND a_error_count = 0 AND aaa_error_count > 0) AS pagesWithoutErrorsAA,
            countIf(aaa_error_count = 0 AND aa_error_count = 0 AND a_error_count = 0) AS pagesWithoutErrorsAAA,
            sum(toUInt64(total_error_count)) AS total_errors
        FROM
        (
            SELECT
                website_id,
                score,
                a_error_count,
                aa_error_count,
                aaa_error_count,
                total_error_count
            FROM accessibility.v_latest_pages_evaluations
        )
        GROUP BY website_id
        ORDER BY
            avg_score DESC,
            dictGetUInt64OrDefault('institution_websites_dict', 'page_count', website_id, toUInt64(0)) DESC,
            pagesWithoutErrorsAAA DESC,
            pagesWithoutErrorsAA DESC,
            pagesWithoutErrorsA DESC
        LIMIT 3
    )
);

-- ============================================================================
-- 2. VIEW GLOBAL STATS
-- ============================================================================
CREATE OR REPLACE VIEW v_global_stats AS
SELECT 
    avg_score AS score,
    websites_count AS websitesCount,
    directories_count AS directoriesCount,
    institutions_count AS entitiesCount,
    count_pages AS pagesCount,
    recent_evaluation_date AS recentPageDate,
    oldest_evaluation_date AS oldestPageDate
FROM accessibility.global_statistics;

-- ============================================================================
-- 3. VIEW RULES GLOBAL TOP SUMMARY 
-- ============================================================================
CREATE OR REPLACE VIEW v_rules_global_top_summary AS
SELECT
    groupArrayIf(
        CAST(
            tuple(rule_id, occurrence_count, pages_count, websites_count),
            'Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64)'
        ),
        rule_result = 'failed'
    ) AS topErrors,

    groupArrayIf(
        CAST(
            tuple(rule_id, occurrence_count, pages_count, websites_count),
            'Tuple(key String, occurrenceCount UInt64, pagesCount UInt64, websitesCount UInt64)'
        ),
        rule_result = 'passed'
    ) AS topBestPractices
FROM
(
    SELECT
        rule_id,
        rule_result,
        occurrence_count,
        pages_count,
        websites_count
    FROM accessibility.global_rules_top_summary
    WHERE rule_result IN ('failed', 'passed')
      AND occurrence_count > 0
    ORDER BY occurrence_count DESC
    LIMIT 5 BY rule_result
);

-- ============================================================================
-- 4. VIEW CONFORMANCE GLOBAL SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW v_conformance_global_summary AS
SELECT
    map(
        'declarations', map(
            'total', map(
                'websites', map(
                    'conform', countIf(dec_status = 'CONFORM'),
                    'partial', countIf(dec_status = 'PARTIAL'),
                    'not_conform', countIf(dec_status = 'NON_CONFORM')
                ),
                'apps', map('conform', 0, 'partial', 0, 'not_conform', 0)
            ),
            'currentYear', map(
                'websites', map(
                    'conform', countIf(dec_status = 'CONFORM' AND is_current_year),
                    'partial', countIf(dec_status = 'PARTIAL' AND is_current_year),
                    'not_conform', countIf(dec_status = 'NON_CONFORM' AND is_current_year)
                ),
                'apps', map('conform', 0, 'partial', 0, 'not_conform', 0)
            )
        ),
        'badges', map(
            'total', map(
                'websites', map(
                    'gold', countIf(stamp_status = 'GOLD'),
                    'silver', countIf(stamp_status = 'SILVER'),
                    'bronze', countIf(stamp_status = 'BRONZE')
                ),
                'apps', map('gold', 0, 'silver', 0, 'bronze', 0)
            ),
            'currentYear', map(
                'websites', map(
                    'gold', countIf(stamp_status = 'GOLD' AND is_current_year),
                    'silver', countIf(stamp_status = 'SILVER' AND is_current_year),
                    'bronze', countIf(stamp_status = 'BRONZE' AND is_current_year)
                ),
                'apps', map('gold', 0, 'silver', 0, 'bronze', 0)
            )
        )
    ) AS conformanceSummary
FROM
(
    SELECT
        m.website_id,
        dictGetOrDefault('declarations_dict', 'status', m.website_id, '') AS dec_status,
        dictGetOrDefault('stamps_dict', 'stamp', m.website_id, '') AS stamp_status,
        true AS is_current_year
    FROM institution_websites_dict AS m
    WHERE m.is_in_observatory = true
);

-- ============================================================================
-- 5. VIEW GLOBAL SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW v_global_summary AS
SELECT
    s.score AS score,
    s.websitesCount AS websitesCount,
    s.directoriesCount AS directoriesCount,
    s.entitiesCount AS entitiesCount,
    s.pagesCount AS pagesCount,
    s.recentPageDate AS recentPageDate,
    s.oldestPageDate AS oldestPageDate,
    w.topWebsites AS topWebsites,
    r.topErrors AS topErrors,
    r.topBestPractices AS topBestPractices,
    c.conformanceSummary AS conformanceSummary
FROM v_global_stats AS s
CROSS JOIN v_top_3_global_websites AS w
CROSS JOIN v_rules_global_top_summary AS r
CROSS JOIN v_conformance_global_summary AS c;