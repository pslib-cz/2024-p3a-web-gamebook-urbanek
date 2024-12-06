using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// P�id�n� slu�by pro SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=gamebook.db"));

// P�id�n� autentizace p�es Google
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = "Cookies";
    options.DefaultChallengeScheme = "Google";
}).AddCookie("Cookies")
  .AddGoogle("Google", options =>
  {
      options.ClientId = "TV�J_GOOGLE_CLIENT_ID";
      options.ClientSecret = "TV�J_GOOGLE_CLIENT_SECRET";
  });

// P�id�n� Swaggeru
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Pou�it� Swaggeru
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Pou�it� autentizace
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();