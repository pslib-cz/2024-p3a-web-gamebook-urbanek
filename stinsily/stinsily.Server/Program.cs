using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// Pøidání služby pro SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=gamebook.db"));

// Pøidání autentizace pøes Google
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "Google";
}).AddCookie("Cookies")
  .AddGoogle("Google", options =>
  {
      options.ClientId = "TVÙJ_GOOGLE_CLIENT_ID";
      options.ClientSecret = "TVÙJ_GOOGLE_CLIENT_SECRET";
  });

// Pøidání Swaggeru
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Použití Swaggeru
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Použití autentizace
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();