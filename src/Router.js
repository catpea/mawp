export default class Router {
  routes = [];

    // Registers a GET route with optional capture groups
    get(path, handler) {
      const regex = this._pathToRegex(path);
      this.routes.push({ method: 'GET', path, regex, handler });
    }

    // Registers a middleware or handler to be used on the router
    use(path, handler) {
      const regex = this._pathToRegex(path);
      this.routes.push({ method: 'USE', path, regex, handler });
    }

    // Convert a route path to a regular expression to capture dynamic segments
    _pathToRegex(path) {
      // Escape regex special characters
      const regexString = path.replace(/([.+*?=^!:${}()|\[\]\/\\])/g, '$1')
                              // Replace :param with (.+) to capture the value
                              .replace(/:([a-zA-Z0-9_]+)/g, '([^/]+)');
      // Create and return the regex pattern with start and end anchors
      return new RegExp(`^${regexString}$`);
    }

    // Function to handle a request
    handleRequest(req, res) {
      const { method, url } = req;

      // Find the matching route handler
      for (const route of this.routes) {
        const match = url.match(route.regex);

        if (match && (route.method === method || route.method === 'USE')) {
          // Capture groups will be stored in match[1], match[2], etc.
          const params = this._extractParams(route.path, match);
          req.params = params;  // Add path params to the request object

          // Parse query parameters from the URL
          req.query = this._parseQuery(url);

          // Call the handler with the request and response
          route.handler(req, res);
          return;
        }
      }

      // No match, respond with 404
      res.statusCode = 404;
      res.end('Not Found');
    }

    // Extract dynamic parameters from the path match
    _extractParams(path, match) {
      const paramNames = (path.match(/:([a-zA-Z0-9_]+)/g) || []).map(param => param.slice(1));
      const params = {};

      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];  // match[0] is the full match, so params start from index + 1
      });

      return params;
    }

    // Parse the query string from the URL into an object
    _parseQuery(url) {
      const queryString = url.split('?')[1];  // Get the query string after '?'
      if (!queryString) return {};

      const params = new URLSearchParams(queryString);
      const query = {};

      // Convert query parameters into an object
      for (const [key, value] of params.entries()) {
        query[key] = value;
      }

      return query;
    }


}
