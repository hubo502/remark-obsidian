const codes = {
  horizontalTab: -2,
  virtualSpace: -1,
  nul: 0,
  eof: null,
  space: 32,
};

function markdownLineEnding(code: any) {
  return code < codes.horizontalTab;
}

function highlight() {
  function tokenize(effects: any, ok: any, nok: any) {
    const startMarker = "==";
    const endMarker = "==";
    let startMarkerCursor = 0,
      endMarkerCursor = 0;

    return start;
    function start(code: any) {
      if (code == startMarker.charCodeAt(startMarkerCursor)) {
        effects.enter("highlight");
        effects.enter("highlightMarker");

        return consumeStart(code);
      }
    }

    function consumeStart(code: any) {
      if (startMarkerCursor == startMarker.length) {
        effects.exit("highlightMarker");
        effects.enter("highlightData");
        return consumeData(code);
      }

      if (code === startMarker.charCodeAt(startMarkerCursor)) {
        effects.consume(code);
        if (code == 61) startMarkerCursor++;

        return consumeStart;
      } else {
        return nok(code);
      }
    }

    function consumeData(code: any) {
      if (markdownLineEnding(code) || code === codes.eof) {
        return nok(code);
      }

      if (code == endMarker.charCodeAt(endMarkerCursor)) {
        effects.exit("highlightData");
        effects.enter("highlightMarker");
        return consumeEnd(code);
      }

      effects.consume(code);
      return consumeData;
    }

    function consumeEnd(code: any) {
      if (endMarkerCursor == endMarker.length) {
        effects.exit("highlightMarker");
        effects.exit("highlight");
        return ok(code);
      }

      if (code !== endMarker.charCodeAt(endMarkerCursor)) {
        return nok(code);
      }

      effects.consume(code);
      endMarkerCursor++;

      return consumeEnd;
    }
  }

  const call = { tokenize };

  return {
    text: { 61: call },
  };
}

export { highlight as syntax };
