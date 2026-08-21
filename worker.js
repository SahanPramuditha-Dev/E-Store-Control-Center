export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("E-Store Control Center Live", { status: 200 });
  },
};
