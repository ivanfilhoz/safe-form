import { useRef as M, useTransition as V, useState as L, useCallback as p, createRef as h, useEffect as Z } from "react";
import { useFormState as q, flushSync as z } from "react-dom";
class B extends Error {
}
const k = (r) => r.flatten().fieldErrors, O = "__safe-form-scalars", G = (r) => {
  const n = new FormData();
  let o = {};
  for (const [l, i] of Object.entries(r)) {
    if (i instanceof File) {
      n.append(l, i);
      continue;
    }
    o[l] = i;
  }
  return n.append(O, JSON.stringify(o)), n;
}, K = (r) => {
  const n = {};
  for (const [o, l] of Array.from(r.entries())) {
    if (o === O) {
      const i = JSON.parse(l);
      for (const [d, a] of Object.entries(i))
        n[d] = a;
      continue;
    }
    n[o] = l;
  }
  return n;
}, N = (r) => {
  var n, o;
  if (r instanceof HTMLSelectElement || r instanceof HTMLTextAreaElement)
    return r.value;
  if (r.type === "checkbox")
    return r.checked;
  if (r.type === "number") {
    const l = parseFloat(r.value || "0");
    return isNaN(l) ? null : l;
  }
  return r.type === "file" ? ((n = r.files) == null ? void 0 : n[0]) ?? null : r.type === "radio" ? r.checked ? r.value : null : r.type === "date" ? ((o = r.valueAsDate) == null ? void 0 : o.toISOString()) ?? null : r.value;
}, W = ({
  action: r,
  schema: n,
  initialState: o,
  initialValues: l,
  validateOnBlur: i,
  validateOnChange: d,
  onSubmit: a,
  onSuccess: b,
  onError: D
}) => {
  const s = M(null), [P, w] = V(), [e, y] = q(r, o ?? null), [R, v] = L({}), [f, g] = L(
    l ?? {}
  ), F = p(() => {
    if (!s.current)
      return f;
    let t = f;
    for (const [c, u] of Object.entries(s.current))
      u != null && u.current && (t[c] = N(u.current));
    return g({
      ...f,
      ...t
    }), t;
  }, [s, f]), T = p(() => {
    const t = F();
    if (!n)
      return !0;
    const c = n.safeParse(t);
    return c.success ? (v({}), !0) : (v(k(c.error)), !1);
  }, [v, n, s, F]), _ = p(
    (t) => f[t],
    [f]
  ), j = p(
    (t, c) => {
      g((u) => ({
        ...u,
        [t]: c
      }));
    },
    [s, g]
  ), E = p(
    (t) => {
      var x, I;
      if (!n)
        return !0;
      let c = f[t];
      (I = (x = s.current) == null ? void 0 : x[t]) != null && I.current && (c = N(
        s.current[t].current
      ));
      const u = n.safeParse({
        [t]: c
      });
      if (!u.success) {
        const A = k(u.error)[t];
        if (A)
          return v((J) => ({
            ...J,
            [t]: A
          })), !1;
      }
      return v((A) => ({
        ...A,
        [t]: void 0
      })), !0;
    },
    [v, n, s, F]
  ), C = p(() => ({
    onSubmit: (t) => {
      if (t.preventDefault(), v({}), a && !a(F()))
        return;
      let c = !1;
      if (z(() => {
        c = T();
      }), !c)
        return;
      const u = G(f);
      w(async () => {
        await y(u);
      });
    },
    action: y
  }), [
    f,
    T,
    v,
    y,
    w,
    y
  ]), H = p(
    (t) => (s.current === null && (s.current = {}), s.current[t] = h(), {
      ref: s.current[t],
      name: t.toString(),
      onBlur: i ? () => E(t) : void 0,
      onChange: d ? () => E(t) : void 0
    }),
    [s, E, i, d]
  );
  return Z(() => {
    (e != null && e.error || e != null && e.fieldErrors) && (D == null || D((e == null ? void 0 : e.error) ?? null, (e == null ? void 0 : e.fieldErrors) ?? null)), e != null && e.response && (b == null || b(e.response));
  }, [e]), {
    error: (e == null ? void 0 : e.error) ?? null,
    response: (e == null ? void 0 : e.response) ?? null,
    fieldErrors: (e == null ? void 0 : e.fieldErrors) ?? R ?? {},
    isPending: P,
    getAll: F,
    validateAll: T,
    getField: _,
    setField: j,
    validateField: E,
    connect: C,
    bindField: H
  };
}, X = (r, n) => async (o, l) => {
  const i = K(l), d = r.safeParse(i);
  if (!d.success)
    return {
      fieldErrors: k(d.error)
    };
  try {
    return {
      response: await n(d.data, o)
    };
  } catch (a) {
    if (a instanceof B)
      return { error: a.message };
    throw a;
  }
};
export {
  B as FormActionError,
  X as createFormAction,
  W as useForm
};
//# sourceMappingURL=safe-form.es.js.map
