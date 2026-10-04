INSERT INTO evaluations (
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
WITH 
    (
        SELECT groupArray(tuple(rule_id, result)) 
        FROM dim_rules_temp
    ) AS global_rules,
    
    (
        SELECT 
            w_id AS website_id,
            (w_id % 40) + 1 AS institution_id,
            [((w_id * 3) % 44) + 1, ((w_id * 7) % 44) + 1] AS directories_ids
        FROM numbers(2000)
    ) AS unique_websites
SELECT
    number + 1000 AS evaluation_id,
    w.directories_ids,
    w.institution_id,
    w.website_id,
    (rand() % 30000) + 1 AS page_id,
    subtractDays(now(), (rand() % 1826) + 1) AS evaluation_date,
    (rand() % 1001) / 100 AS score,
    rule_tuple.1 AS rule_id,
    toUInt32((rand() % 200) + 1) AS count,
    rule_tuple.2 AS rule_result
FROM numbers(1000000)
CROSS APPLY (
    SELECT website_id, institution_id, directories_ids 
    FROM unique_websites 
    WHERE website_id = ((number % 2000) + 1)
) AS w
ARRAY JOIN arraySlice(arrayShuffle(global_rules), 1, 25) AS rule_tuple;


INSERT INTO evaluations (
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
WITH 
    (
        SELECT groupArray(tuple(rule_id, result)) 
        FROM dim_rules_temp
    ) AS global_rules
SELECT
    number + 1000 AS evaluation_id,
    [((((number % 2000) + 1) * 3) % 44) + 1, ((((number % 2000) + 1) * 7) % 44) + 1] AS directories_ids,
    (((number % 2000) + 1) % 40) + 1 AS institution_id,
    (number % 2000) + 1 AS website_id,
    (rand() % 30000) + 1 AS page_id,
    subtractDays(now(), (rand() % 1826) + 1) AS evaluation_date,
    (rand() % 1001) / 100 AS score,
    rule_tuple.1 AS rule_id,
    toUInt32((rand() % 200) + 1) AS count,
    rule_tuple.2 AS rule_result
FROM numbers(1000000)
ARRAY JOIN arraySlice(arrayShuffle(global_rules), 1, 25) AS rule_tuple;





INSERT INTO evaluations_temp (
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
WITH 
    (
        SELECT groupArray(tuple(rule_id, result)) 
        FROM dim_rules_temp
    ) AS global_rules
SELECT
    number + 1000000 AS evaluation_id,
    [((((number % 2000) + 1) * 3) % 44) + 1, ((((number % 2000) + 1) * 7) % 44) + 1] AS directories_ids,
    (((number % 2000) + 1) % 40) + 1 AS institution_id,
    (number % 2000) + 1 AS website_id,
    (rand() % 30000) + 1 AS page_id,
    subtractDays(now(), (rand() % 1826) + 1) AS evaluation_date,
    (rand() % 1001) / 100 AS score,
    rule_tuple.1 AS rule_id,
    toUInt32((rand() % 200) + 1) AS count,
    rule_tuple.2 AS rule_result
FROM numbers(1000000)
ARRAY JOIN arraySlice(arrayShuffle(global_rules), 1, 25) AS rule_tuple;




INSERT INTO evaluations_temp (
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
WITH 
    (
        SELECT groupArray(tuple(rule_id, result)) 
        FROM dim_rules_temp
    ) AS global_rules
SELECT
    number + 1000000 AS evaluation_id,
    directories_ids,
    institution_id,
    website_id,
    page_id,
    evaluation_date,
    score,
    rule_tuple.1 AS rule_id,
    toUInt32((rand() % 200) + 1) AS count,
    rule_tuple.2 AS rule_result
FROM (
    SELECT
        number,
        arraySlice(
            arrayShuffle(arrayMap(x -> x + 1, range(44))),
            1,
            CASE 
                WHEN rand() % 100 < 70 THEN 1 
                WHEN rand() % 100 < 90 THEN 2 
                ELSE 3 
            END
        ) AS directories_ids,
        (rand() % 40) + 1 AS institution_id,
        (rand() % 2000) + 1 AS website_id,
        (rand() % 30000) + 1 AS page_id,
        subtractDays(now(), (rand() % 1826) + 1) AS evaluation_date,
        (rand() % 1001) / 100 AS score,
        arraySlice(arrayShuffle(global_rules), 1, 25) AS selected_rules
    FROM numbers(200000)
)
ARRAY JOIN selected_rules AS rule_tuple;