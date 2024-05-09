import { useRef as J, useTransition as M, useState as L, useCallback as p, createRef as V, useEffect as Z } from "react";
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
  onSuccess: A,
  onError: D
}) => {
  const s = J(null), [P, x] = M(), [e, y] = q(r, o ?? null), [R, v] = L({}), [f, g] = L(
    l ?? {}
  ), F = p(() => {
    if (!s.current)
      return f;
    let t = f;
    for (const [u, c] of Object.entries(s.current))
      c != null && c.current && (t[u] = N(c.current));
    return g({
      ...f,
      ...t
    }), t;
  }, [s, f]), w = p(() => {
    const t = F();
    if (!n)
      return !0;
    const u = n.safeParse(t);
    return u.success ? (v({}), !0) : (v(k(u.error)), !1);
  }, [v, n, s, F]), _ = p(
    (t) => f[t],
    [f]
  ), h = p(
    (t, u) => {
      g((c) => ({
        ...c,
        [t]: u
      }));
    },
    [s, g]
  ), E = p(
    (t) => {
      var T, I;
      if (!n)
        return !0;
      let u = f[t];
      (I = (T = s.current) == null ? void 0 : T[t]) != null && I.current && (u = N(
        s.current[t].current
      ));
      const c = n.safeParse({
        [t]: u
      });
      if (!c.success) {
        const b = k(c.error)[t];
        if (b)
          return v((H) => ({
            ...H,
            [t]: b
          })), !1;
      }
      return v((b) => ({
        ...b,
        [t]: void 0
      })), !0;
    },
    [v, n, s, F]
  ), j = p(() => ({
    onSubmit: async (t) => {
      if (t.preventDefault(), v({}), a && !await a(F()))
        return;
      let u = !1;
      if (z(() => {
        u = w();
      }), !u)
        return;
      const c = G(f);
      x(async () => {
        await y(c);
      });
    },
    action: y
  }), [
    f,
    w,
    v,
    y,
    x,
    y
  ]), C = p(
    (t) => (s.current === null && (s.current = {}), s.current[t] = V(), {
      ref: s.current[t],
      name: t.toString(),
      onBlur: i ? () => E(t) : void 0,
      onChange: d ? () => E(t) : void 0
    }),
    [s, E, i, d]
  );
  return Z(() => {
    (e != null && e.error || e != null && e.fieldErrors) && (D == null || D((e == null ? void 0 : e.error) ?? null, (e == null ? void 0 : e.fieldErrors) ?? null)), e != null && e.response && (A == null || A(e.response));
  }, [e]), {
    error: (e == null ? void 0 : e.error) ?? null,
    response: (e == null ? void 0 : e.response) ?? null,
    fieldErrors: (e == null ? void 0 : e.fieldErrors) ?? R ?? {},
    isPending: P,
    getAll: F,
    validateAll: w,
    getField: _,
    setField: h,
    validateField: E,
    connect: j,
    bindField: C
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
