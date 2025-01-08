using Microsoft.AspNetCore.Identity;
using stinsily.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Move the DbContext configuration to the top and make it more explicit
var connectionString = "Data Source=gamebook.db";
builder.Services.AddDbContext<AppDbContext>(options => 
    options.UseSqlite(connectionString), 
    ServiceLifetime.Scoped
);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddIdentityApiEndpoints<IdentityUser>(options =>
{
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireDigit = false;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder =>
        {
            builder
                .WithOrigins(
                    "https://localhost:50701",
                    "http://localhost:50701",
                    "http://localhost:5173"
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials()
                .WithExposedHeaders("Content-Disposition");
        });
});

// Add authentication
builder.Services.AddAuthentication().AddBearerToken();

// Add authorization
builder.Services.AddAuthorization();

builder.Services.AddScoped<RoleManager<IdentityRole>>();

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
});

var app = builder.Build();

// Configure paths for static files
var webRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
var uploadsPath = Path.Combine(webRootPath, "uploads");

// Ensure directories exist
if (!Directory.Exists(webRootPath))
{
    Directory.CreateDirectory(webRootPath);
}
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

// Configure static files middleware
app.UseStaticFiles(); // For wwwroot
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseRouting();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

// Initialize database and createroles/admin user
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    context.Database.Migrate(); // This ensures the database is created

    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = services.GetRequiredService<UserManager<IdentityUser>>();

    // Create Admin role if it doesn't exist
    if (!roleManager.RoleExistsAsync("Admin").Result)
    {
        roleManager.CreateAsync(new IdentityRole("Admin")).Wait();
    }

    // Create admin user if it doesn't exist
    var adminEmail = "admin@admin.com";
    var adminUser = userManager.FindByEmailAsync(adminEmail).Result;
    if (adminUser == null)
    {
        adminUser = new IdentityUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true
        };
        userManager.CreateAsync(adminUser, "adminPassword123").Wait();
        userManager.AddToRoleAsync(adminUser, "Admin").Wait();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapCustomIdentityApi<IdentityUser>();

app.MapControllers();

app.Run();