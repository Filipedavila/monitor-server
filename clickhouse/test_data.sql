INSERT INTO evaluations_tests
SELECT
    number AS evaluationId,
    (rand() % 100) + 1 AS directoryID,
    (rand() % 50000) + 1 AS websiteId,
    (rand() % 3000000) + 1 AS page_id,
    (rand() % 500) + 1 AS entity_id,
  
    subtractDays(now(), (rand() % 30) + 1) AS evaluationDate,
    
    arrayElement([
        'a_01a', 'a_01b', 'a_02a', 'a_02b', 'a_03', 'a_04', 'a_05', 'a_06', 'a_07', 'a_09', 'a_10', 'a_11', 'a_12', 'a_13',
        'abbr_01', 'area_01a', 'area_01b', 'aria_01', 'aria_02', 'aria_03', 'aria_04', 'aria_05', 'aria_06', 'aria_07', 'aria_08',
        'audio_video_01', 'audio_video_02', 'autocomplete_01', 'autocomplete_02', 'blink_02', 'br_01', 'button_01', 'button_02',
        'color_01', 'color_02', 'color_02b', 'css_01', 'css_02', 'ehandler_02', 'ehandler_03', 'ehandler_04', 'element_01',
        'element_02', 'element_03', 'element_04', 'element_05', 'element_06', 'element_07', 'element_08', 'element_09', 'element_10',
        'field_01', 'field_02', 'focus_01', 'font_01', 'font_02', 'form_01a', 'form_01b', 'frame_01', 'headers_01', 'headers_02',
        'heading_01', 'heading_02', 'heading_03', 'heading_04', 'hx_01a', 'hx_01b', 'hx_01c', 'hx_02', 'hx_03', 'id_01', 'id_02',
        'iframe_01', 'iframe_02', 'iframe_03', 'iframe_04', 'iframe_05', 'img_01a', 'img_01b', 'img_02', 'img_03', 'img_04',
        'inp_img_01a', 'inp_img_01b', 'input_01', 'input_02', 'input_02b', 'input_03', 'justif_txt_01', 'justif_txt_02', 'label_01',
        'label_02', 'label_02b', 'label_03', 'landmark_01', 'landmark_02', 'landmark_03', 'landmark_04', 'landmark_05', 'landmark_06',
        'landmark_07', 'landmark_08', 'landmark_09', 'landmark_10', 'landmark_11', 'landmark_12', 'landmark_13', 'landmark_14',
        'lang_01', 'lang_02', 'lang_03', 'lang_04', 'layout_01a', 'layout_01b', 'layout_03', 'letter_01', 'letter_02', 'link_01',
        'list_01', 'list_02', 'list_03', 'list_04', 'list_05', 'list_06', 'list_07', 'listitem_01', 'listitem_02', 'menuItem_01',
        'menuItem_02', 'meta_01', 'meta_02', 'meta_03', 'meta_04', 'meta_05', 'object_01', 'object_02', 'orientation_01',
        'orientation_02', 'role_01', 'role_02', 'scope_01', 'scrollable_01', 'scrollable_02', 'svg_01', 'svg_02', 'table_01',
        'table_02', 'table_03', 'table_04', 'table_05a', 'table_06', 'table_07', 'table_08', 'textC_01', 'textC_02', 'title_01',
        'title_02', 'title_03', 'title_04', 'title_05', 'title_06', 'values_01a', 'values_01b', 'values_02a', 'values_02b',
        'video_01', 'video_02', 'win_01', 'word_01', 'word_02'
    ], (rand() % 170) + 1) AS rule_code,    

    tuple(
        toUInt32(rand() % 150), 
        toUInt32(rand() % 20),  
        toUInt32(rand() % 15)   
    ) AS results,
    (rand() % 1001) / 100 AS score
FROM numbers(300000000);