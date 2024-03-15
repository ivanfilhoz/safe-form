import { useRef as C, useTransition as O, useState as x, useCallback as i, createRef as Z } from "react";
import { useFormState as _, flushSync as q } from "react-dom";
class z extends Error {
  constructor(n) {
    super(n), this.message = n;
  }
}
const D = (t) => t.flatten().fieldErrors, I = (t) => {
  var n;
  return t.type === "checkbox" ? t.checked : t.type === "number" ? parseFloat(t.value) : t.type === "file" ? t.files ?? null : t.type === "radio" ? t.checked ? t.value : null : t.type === "date" ? ((n = t.valueAsDate) == null ? void 0 : n.toISOString()) ?? null : t.value;
}, H = ({
  action: t,
  schema: n,
  initialState: E,
  initialValues: b,
  validateOnBlur: f,
  validateOnChange: a
}) => {
  const e = C(null), [A, P] = O(), [c, d] = _(t, E ?? null), [R, l] = x({}), [u, k] = x(
    b ?? {}
  ), v = i(() => {
    if (!e.current)
      return u;
    let r = u;
    if (e.current) {
      console.log(e.current);
      for (const [o, s] of Object.entries(e.current))
        s != null && s.current && (r[o] = I(s.current));
      k({
        ...u,
        ...r
      });
    }
    return r;
  }, [e, u]), w = i(() => {
    if (!n)
      return !0;
    const r = v(), o = n.safeParse(r);
    return o.success ? (l({}), !0) : (l(D(o.error)), !1);
  }, [l, n, e, v]), h = i(
    (r) => u[r],
    [u]
  ), j = i(
    (r, o) => {
      k((s) => ({
        ...s,
        [r]: o
      }));
    },
    [e, k]
  ), p = i(
    (r) => {
      var F, y;
      if (!n)
        return !0;
      let o = u[r];
      (y = (F = e.current) == null ? void 0 : F[r]) != null && y.current && (o = I(
        e.current[r].current
      ));
      const s = n.safeParse({
        [r]: o
      });
      if (!s.success) {
        const g = D(s.error)[r];
        if (g)
          return l((V) => ({
            ...V,
            [r]: g
          })), !1;
      }
      return l((g) => ({
        ...g,
        [r]: void 0
      })), !0;
    },
    [l, n, e, v]
  ), S = i(() => ({
    onSubmit: (r) => {
      r.preventDefault(), l({});
      let o = !1;
      if (q(() => {
        o = w();
      }), !o)
        return;
      console.log(u);
      const s = new FormData();
      for (const [F, y] of Object.entries(u))
        s.append(F, y);
      P(async () => {
        await d(s);
      });
    },
    action: d
  }), [
    u,
    w,
    l,
    d,
    P,
    d
  ]), T = i(
    (r) => (e.current === null && (e.current = {}), e.current[r] = Z(), console.log(r, e.current), {
      ref: e.current[r],
      name: r.toString(),
      onBlur: f ? () => p(r) : void 0,
      onChange: a ? () => p(r) : void 0
    }),
    [e, p, f, a]
  );
  return {
    error: (c == null ? void 0 : c.error) ?? null,
    response: (c == null ? void 0 : c.response) ?? null,
    fieldErrors: (c == null ? void 0 : c.fieldErrors) ?? R ?? {},
    isPending: A,
    getAll: v,
    validateAll: w,
    getField: h,
    setField: j,
    validateField: p,
    connect: S,
    bindField: T
  };
}, J = (t, n) => async (E, b) => {
  const f = {};
  for (const [e, A] of Array.from(b.entries()))
    f[e] = A;
  const a = t.safeParse(f);
  if (!a.success)
    return {
      fieldErrors: D(a.error)
    };
  try {
    return {
      response: await n(a.data, E)
    };
  } catch (e) {
    if (e instanceof z)
      return { error: e.message };
    throw e;
  }
};
export {
  z as FormActionError,
  J as createFormAction,
  H as useForm
};
