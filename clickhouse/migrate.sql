INSERT INTO accessibility.evaluations (
    evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    rule_result
)
SELECT 
    evaluation_id, 
    dictGet('institution_websites_dict', 'directories_ids', toUInt64(website_id)) AS directories_ids,
    dictGet('institution_websites_dict', 'institution_id', toUInt64(website_id)) AS institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_id,
    count,
    rule_result
FROM migration_new.evaluations;
