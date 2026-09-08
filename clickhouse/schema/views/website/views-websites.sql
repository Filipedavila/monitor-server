SELECT 
    sum(aaa_error_count) AS total_aaa_errors,
    sum(aa_error_count) AS total_aa_errors,
    sum(a_error_count) AS total_a_errors,
    sum(total_error_count) AS grand_total_errors
FROM latest_page_evaluations FINAL
WHERE website_id = 1221;