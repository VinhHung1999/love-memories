# iOS Build Issues

## Pod install modular headers fix
When Firebase Core Internal fails with "does not define modules" error, add `use_modular_headers!` to Podfile before `target`:

```ruby
use_modular_headers!
```
