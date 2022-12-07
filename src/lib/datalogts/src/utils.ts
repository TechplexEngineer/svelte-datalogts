import {Datom, DatomPart, ResultContext, SearchContext} from "./datom";

export function isVariable(x: any): boolean {
  return typeof x === "string" && x.startsWith("?");
}

function matchVariable(variable:string, triplePart: DatomPart, context: SearchContext) {
  if (context.hasOwnProperty(variable)) {
    const bound = context[variable];
    return matchPart(bound, triplePart, context);
  }
  return { ...context, [variable]: triplePart };
}

/**
 * Compare a patternPart to a triplePart.
 */
export function matchPart(patternPart: DatomPart, triplePart: DatomPart, context: SearchContext): ResultContext {
  if (!context) return null;
  if (typeof patternPart === "string" && isVariable(patternPart)) {
    return matchVariable(patternPart, triplePart, context);
  }
  return patternPart === triplePart ? context : null;
}

/**
 * Check if pattern matches triple with context substitutions
 */
export function matchPattern(pattern: Datom, triple: Datom, context: SearchContext): ResultContext {
  return pattern.reduce((context, patternPart, idx) => {
    const triplePart = triple[idx];
    return matchPart(patternPart, triplePart, context);
  }, context);
}

export function actualize(context: SearchContext, find: string[]) {
    return find.map((findPart) => {
        return isVariable(findPart) ? context[findPart] : findPart;
    });
}

export function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}