
import * as qualweb from "./qualweb";
import  {testColors,ruleset, getElementsMapping, generateScore}  from "@a12e/accessmonitor-rulesets";
import { generateMd5Hash } from "src/common/security"; 


function calculateTotalElements(tags: Record<string, number>): number {
  let total = 0;
  for (const tag in tags) {
    if (tags.hasOwnProperty(tag)) {
      total += tags[tag];
    }
  }
  return total;
}

function calculateConform(results: any): string {
  const errors = {
    A: 0,
    AA: 0,
    AAA: 0,
  };
  
  for (const ee in results || {}) {
    if (ee) {
      let level =  ruleset[ee].level.toUpperCase();
      if (testColors[ee] === "R") {
        errors[level]++;
      }
    }
  }

  return `${errors.A}@${errors.AA}@${errors.AAA}`;
}

function parseEvaluation(evaluation: any): any {
  const { elements, results, nodes ,metrics } = getElementsMapping(evaluation);
  console.log("Results mapping:", JSON.stringify(elements, null, 2));
  const report: any = {};

  report.pagecode = evaluation.system.page.dom.html;
  report["data"] = {};
  report["data"].title = evaluation.system.page.dom.title;
  report["data"].rawUrl = evaluation?.system?.url?.completeUrl || "";
  report["data"].elems = elements;
  report["data"].nodes = nodes;
  report["data"].date = new Date()
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "");
  report["data"].tot = {};
  report["data"].tot.info = {};
  report["data"].tot.info.url = report["data"].rawUrl;
  report["data"].tot.info.title = report["data"].title;
  report["data"].tot.info.date = report["data"].date;
  report["data"].tot.info.htmlTags = calculateTotalElements(evaluation.modules.counter.data.tags); 
  report["data"].tot.info.roles = evaluation.modules.counter.data.roles;
  report["data"].tot.info.cTags = evaluation.modules.counter.data.tags;
  report["data"].tot.info.size = 
    encodeURI(report.pagecode).split(/%..|./).length - 1;
  report["data"].tot.info.encoding = "utf-8";
 // report["data"].tot.info.lang = getHtmlLang(evaluation.system.page.dom.html);
  report["data"].tot.info.content = "text/html";
  report["data"].tot.info.hash = generateMd5Hash(report["data"].date);
  report["data"].tot.info.tests = Object.keys(results).length;
  report["data"].tot.elems = report["data"].elems;
  report["data"].tot.results = results;
  report["data"].conform = calculateConform(report["data"].tot.results);
  report["data"].tot.info.conform = report["data"].conform  ;


  report["data"].score = generateScore(report);
  report["data"].tot.info.score = report["data"].score;
  report["data"].metrics = metrics;
  console.log("METRICS MAPPING:", JSON.stringify(metrics, null, 2));
  return report;
}

export async function executeUrlEvaluation(url: string): Promise<any> {
  const params = {
    url,
  };

  params.url = params.url.trim();
  if (!params.url.startsWith("http://") && !params.url.startsWith("https://")) {
    params.url = "http://" + params.url;
  }

  const reports = await qualweb.evaluate(params);
  return parseEvaluation(reports[params.url]);
}

export async function executeUrlsEvaluation(urls: string[]): Promise<any> {
  const normalized = new Array<string>();

  for (const url of urls ?? []) {
    const _url = url.trim();
    if (!_url.startsWith("http://") && !_url.startsWith("https://")) {
      normalized.push("http://" + _url);
    } else {
      normalized.push(_url);
    }
  }

  const params = {
    urls: normalized,
  };

  const reports = await qualweb.evaluate(params);
  for (const url in reports ?? {}) {
    if (url && reports[url]) {
      reports[url] = parseEvaluation(reports[url]);
    }
  }
  return reports;
}

export async function executeHtmlEvaluation(html: string): Promise<any> {
  const reports = await qualweb.evaluate({ html });
  return parseEvaluation(reports["customHtml"]);
}
