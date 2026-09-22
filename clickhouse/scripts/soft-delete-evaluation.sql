
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
SELECT 
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
    1 AS is_deleted
FROM accessibility.evaluations_temp FINAL
PREWHERE is_deleted = 0 AND is_migrated = 0
WHERE evaluation_id = {evaluationId:UInt32};