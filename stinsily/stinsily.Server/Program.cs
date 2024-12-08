using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using stinsily.Server.Data;
using Microsoft.AspNetCore.Identity.UI.Services;

var builder = WebApplication.CreateBuilder(args);

// P�id�n� slu�by pro SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=gamebook.db"));

// Nastaven� Identity
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireDigit = false;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<AppDbContext>();

// Nastaven� autorizace pro role
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});

builder.Services.AddControllers();

//// P�id�n� autentizace p�es Google
//builder.Services.AddAuthentication(options =>
//{
//    options.DefaultScheme = "Cookies";
//    options.DefaultChallengeScheme = "Google";
//}).AddCookie("Cookies")
//  .AddGoogle("Google", options =>
//  {
//      options.ClientId = "TV�J_GOOGLE_CLIENT_ID";
//      options.ClientSecret = "TV�J_GOOGLE_CLIENT_SECRET";
//  });

// P�id�n� Swaggeru
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder =>
        {
            builder
                .WithOrigins("https://localhost:50701") // port vašeho frontendu
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials(); // Důležité pro credentials: "include"
        });
});

var app = builder.Build();

// Automatick� vytvo�en� u�ivatele admina
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    // Vytvo�en� role Admin
    if (!await roleManager.RoleExistsAsync("Admin"))
    {
        await roleManager.CreateAsync(new IdentityRole("Admin"));
    }

    // Vytvo�en� u�ivatele Admin
    var adminEmail = "kokt@pica.com";
    var adminPassword = "zmrdecek";

    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var adminUser = new IdentityUser
        {
            UserName = adminEmail,
            Email = adminEmail
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}

// Pou�it� Swaggeru
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Pou�it� autentizace
app.UseRouting();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapGroup("/api").MapCustomIdentityApi<IdentityUser>(); // Vyu�it� Identity API endpoint�

app.MapControllers();
app.Run();