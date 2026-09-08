

TRUNCATE TABLE latest_page_evaluations;

INSERT INTO latest_page_evaluations SELECT
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score,
    sumIf(count,dictGet('rules_dict', 'wcag_level', rule_id) = 'AAA' AND rule_result = 'failed') AS aaa_error_count,
    sumIf(count,dictGet('rules_dict', 'wcag_level', rule_id) = 'AA' AND rule_result = 'failed') AS aa_error_count,
    sumIf(count,dictGet('rules_dict', 'wcag_level', rule_id) = 'A' AND rule_result = 'failed') AS a_error_count,
    sumIf(count,rule_result = 'failed') AS total_error_count,
    toUnixTimestamp64Milli(now64(3)) AS version
FROM evaluations
GROUP BY
    institution_id,
    directories_ids,
    website_id,
    page_id,
    evaluation_id,
    evaluation_date,
    score;


TRUNCATE TABLE global_rules_time_series;
 INSERT INTO global_rules_time_series SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY quarter_start, rule_id, rule_result;

TRUNCATE TABLE global_rules_top_summary;

INSERT INTO global_rules_top_summary SELECT
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY rule_id, rule_result;

TRUNCATE TABLE global_directories_statistics;

 INSERT INTO global_directories_statistics WITH
    combined_latest AS (
        SELECT * FROM latest_page_evaluations FINAL
        WHERE directories_ids IS NOT NULL AND length(directories_ids) > 0

        UNION ALL

        SELECT * FROM latest_page_evaluations_temp
        WHERE directories_ids IS NOT NULL AND length(directories_ids) > 0
    )
SELECT
    min(score) AS min_score,
    max(score) AS max_score,
    avg(CAST(score, 'Decimal64(4)')) AS avg_score,
    uniqArray(directories_ids) AS directories_count,
    uniq(institution_id) AS institutions_count,
    uniq(website_id) AS websites_count,
    uniq(page_id) AS page_count,
    min(evaluation_date) AS oldest_evaluation_date,
    max(evaluation_date) AS recent_evaluation_date
FROM (
    SELECT * FROM latest_page_evaluations FINAL
    WHERE directories_ids IS NOT NULL AND length(directories_ids) > 0

    UNION ALL

    SELECT * FROM latest_page_evaluations_temp
    WHERE directories_ids IS NOT NULL AND length(directories_ids) > 0
) AS combined_latest;

TRUNCATE TABLE directory_snapshots_statistics_time_series;

 INSERT INTO directory_snapshots_statistics_time_series SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    arrayJoin(directories_ids) AS directory_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, directory_id;


TRUNCATE TABLE institution_snapshots_statistics;
 INSERT INTO institution_snapshots_statistics SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    institution_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, institution_id;


TRUNCATE TABLE institution_snapshot_rules_mv;

INSERT INTO institution_snapshot_rules_mv SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    institution_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count,
    groupBitmapState(website_id) AS websites_count
FROM evaluations
GROUP BY quarter_start, institution_id, rule_id, rule_result;


TRUNCATE TABLE website_snapshots_statistics;
INSERT INTO  website_snapshots_statistics SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, website_id;

TRUNCATE TABLE website_snapshot_rules;
INSERT INTO website_snapshot_rules SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count,
    groupBitmapState(page_id) AS pages_count
FROM evaluations
GROUP BY quarter_start, website_id, rule_id, rule_result;



TRUNCATE TABLE page_snapshots_statistics;

 INSERT INTO page_snapshots_statistics SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    page_id,
    min(score) AS min_score,
    max(score) AS max_score,
    avgState(score) AS avg_score,
    uniqState(evaluation_id) AS count_evals
FROM evaluations
GROUP BY quarter_start, website_id, page_id;

TRUNCATE TABLE page_snapshot_rules;
INSERT INTO page_snapshot_rules SELECT
    toStartOfQuarter(evaluation_date) AS quarter_start,
    website_id,
    page_id,
    rule_id,
    rule_result,
    sum(toUInt32(count)) AS occurrence_count
FROM evaluations
GROUP BY quarter_start, website_id, page_id, rule_id, rule_result;

SYSTEM  RELOAD DICTIONARIES;
SYSTEM REFRESH VIEW mv_latest_page_evaluations_temp;
SYSTEM REFRESH VIEW mv_global_directories_statistics;
SYSTEM REFRESH VIEW mv_ranked_directories;
SYSTEM REFRESH VIEW mv_refresh_temp_rules;
SYSTEM REFRESH VIEW mv_global_statistics;