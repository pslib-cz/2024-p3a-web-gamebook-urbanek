using Microsoft.AspNetCore.Identity;
using stinsily.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Check if we're in database initialization mode
var isInitializingDb = args.Length > 0 && args[0] == "--initialize-db";

var connectionString = "Data Source=/app/data/gamebook.db";
builder.Services.AddDbContext<AppDbContext>(options => 
{
    options.UseSqlite(connectionString);
    if (!isInitializingDb)
    {
        // Set read-only mode for runtime
        options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
    }
}, ServiceLifetime.Scoped);

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
                .WithExposedHeaders("Content-Disposition")
                .SetIsOriginAllowed(_ => true);
        });
});

builder.Services.AddAuthentication().AddBearerToken();

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

// Database initialization during build
if (isInitializingDb)
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<AppDbContext>();
        
        // Create database and schema
        context.Database.EnsureCreated();

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<IdentityUser>>();

        // Create admin role
        if (!roleManager.RoleExistsAsync("Admin").Result)
        {
            roleManager.CreateAsync(new IdentityRole("Admin")).Wait();
        }

        // Create admin user
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

        // Exit after database initialization
        Environment.Exit(0);
    }
}

// Normal runtime configuration
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapCustomIdentityApi<IdentityUser>();
app.MapControllers();

app.Run();