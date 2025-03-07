import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
})

print(f"Serving at http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()