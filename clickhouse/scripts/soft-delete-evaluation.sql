
INSERT INTO accessibility.evaluations_temp (
    evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    rule_weight,
    rule_trust,
    rule_type,
    rule_result,
    rule_counts,
    is_deleted
)
SELECT evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    rule_weight,
    rule_trust,
    rule_type,
    rule_result,
    rule_counts,
    1 FROM evaluations_temp
PREWHERE is_deleted = 0 AND is_migrated = 0
WHERE rule_code = 'landmark_08'







SELECT
    rule_id AS rule_code,
    sum(toUInt32(count)) AS count
FROM
(
    SELECT
        rule_id,
        rule_result,
        is_migrated,
        argMax(count, version) AS count,
        argMax(is_deleted, version) AS latest_is_deleted
    FROM evaluations_temp
    GROUP BY
        institution_id,
        evaluation_date,
        website_id,
        evaluation_id,
        rule_id,
        rule_result,
        is_migrated
)
WHERE latest_is_deleted = 0
  AND is_migrated = 0
  AND rule_result = 'passed'
GROUP BY rule_id
ORDER BY count DESC LIMIT 10;