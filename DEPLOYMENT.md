# Deployment Guide

This guide will help you deploy the backend on Render.com and the frontend on Vercel.

## Prerequisites

- GitHub account (both Render and Vercel integrate with GitHub)
- Your code pushed to a GitHub repository
- LLM API key (OpenRouter, OpenAI, Anthropic, or Google)

## Backend Deployment on Render.com

### Step 1: Create a Render Account

1. Go to [Render.com](https://render.com)
2. Sign up using your GitHub account

### Step 2: Create a PostgreSQL Database

1. From the Render dashboard, click **New +** → **PostgreSQL**
2. Configure the database:
   - **Name**: `ticketsupport-db`
   - **Database**: `ticketsupport`
   - **User**: `ticketsupport`
   - **Region**: Choose the closest to your users
   - **Plan**: Free tier is fine for testing
3. Click **Create Database**
4. Wait for the database to be created (it will show as "Available")

### Step 3: Deploy the Backend

1. From the Render dashboard, click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure the web service:
   - **Name**: `ticketsupport-backend`
   - **Region**: Same as your database
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty
   - **Runtime**: `Python 3`
   - **Build Command**: `./backend/build.sh`
   - **Start Command**: `cd backend && gunicorn config.wsgi:application`

4. Set environment variables (click **Add Environment Variable**):
   ```
   PYTHON_VERSION = 3.11.0
   SECRET_KEY = [Auto-generate a secure key]
   DEBUG = False
   DATABASE_URL = [Select your database from the dropdown]
   LLM_PROVIDER = openrouter (or your preferred provider)
   LLM_API_KEY = [Your API key]
   OPENROUTER_MODEL = openai/gpt-4o-mini
   ```

5. Click **Create Web Service**
6. Wait for the deployment to complete (first deployment takes 5-10 minutes)
7. Once deployed, note your backend URL (e.g., `https://ticketsupport-backend.onrender.com`)

### Step 4: Update CORS Settings

1. In Render, go to your web service → **Environment**
2. Add a new environment variable:
   ```
   FRONTEND_URL = [Your Vercel URL from the next section]
   ```
3. Save changes (this will trigger a redeploy)

## Frontend Deployment on Vercel

### Step 1: Create a Vercel Account

1. Go to [Vercel.com](https://vercel.com)
2. Sign up using your GitHub account

### Step 2: Deploy the Frontend

1. From the Vercel dashboard, click **Add New** → **Project**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Create React App (should auto-detect)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. Set environment variables:
   - Click **Environment Variables**
   - Add:
     ```
     REACT_APP_API_URL = https://ticketsupport-backend.onrender.com
     ```
   (Replace with your actual Render backend URL from Step 3.7)

5. Click **Deploy**
6. Wait for the deployment to complete (usually 1-2 minutes)
7. Once deployed, note your frontend URL (e.g., `https://ticketsupport-frontend.vercel.app`)

### Step 3: Update Backend CORS Settings

1. Go back to Render
2. Navigate to your backend web service → **Environment**
3. Update or add the `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL = https://your-app.vercel.app
   ```
4. Save changes (this will redeploy the backend)

## Verification

### Test the Backend

1. Visit your backend URL + `/admin` (e.g., `https://ticketsupport-backend.onrender.com/admin`)
2. You should see the Django admin login page
3. Test the API endpoint: Visit `https://your-backend.onrender.com/api/tickets/`

### Test the Frontend

1. Visit your Vercel frontend URL
2. Try creating a new ticket
3. Verify it shows up in the list
4. Check that LLM classification is working

## Troubleshooting

### Backend Issues

**500 Error on backend:**
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Ensure `DEBUG=False` for production

**Database connection errors:**
- Verify `DATABASE_URL` is correctly linked to your database
- Check database status in Render dashboard

**Static files not loading:**
- Ensure `collectstatic` ran successfully in build logs
- Check build.sh is executable: `chmod +x backend/build.sh`

### Frontend Issues

**API calls failing:**
- Check browser console for CORS errors
- Verify `REACT_APP_API_URL` is set correctly
- Ensure backend `FRONTEND_URL` includes your Vercel domain

**Environment variables not working:**
- In Vercel, redeploy after adding environment variables
- Environment variables must start with `REACT_APP_`

**404 on page refresh:**
- This should be handled by the `vercel.json` configuration
- If issues persist, check Vercel logs

### LLM Classification Not Working

- Verify your LLM API key is valid and has credits
- Check backend logs for LLM-related errors
- Test API key directly with the provider's API

## Updating Your Deployment

### Backend Updates

1. Push changes to GitHub
2. Render will automatically deploy the new version
3. Or manually trigger: Dashboard → Your Service → Manual Deploy

### Frontend Updates

1. Push changes to GitHub
2. Vercel will automatically deploy the new version
3. Or manually trigger: Dashboard → Your Project → Deployments → Redeploy

## Cost Considerations

### Render (Free Tier)

- Web service spins down after 15 minutes of inactivity
- 750 hours/month of running time
- PostgreSQL: 90 days retention, 256 MB RAM, 1 GB storage

### Vercel (Free Tier)

- Unlimited hobby sites
- 100 GB bandwidth/month
- Automatic HTTPS

### LLM Costs

- **OpenRouter** (Recommended): Pay per use, has free models
  - `openai/gpt-4o-mini`: ~$0.15 per 1M tokens
  - Free models available for testing
- **OpenAI**: Requires paid account (~$0.15-$5 per 1M tokens)
- **Anthropic**: Requires paid account
- **Google Gemini**: Generous free tier

## Production Best Practices

1. **Security:**
   - Never commit `.env` files
   - Use strong `SECRET_KEY` (auto-generated by Render)
   - Keep `DEBUG=False` in production
   - Regularly rotate API keys

2. **Monitoring:**
   - Check Render logs regularly
   - Monitor database usage
   - Set up monitoring alerts in Render

3. **Database:**
   - Regularly backup your database
   - Monitor database size
   - Consider upgrading to paid tier for production workloads

4. **Performance:**
   - Enable caching in Django if needed
   - Monitor API response times
   - Consider CDN for static files

## Support

- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs
- **Django Deployment Checklist**: https://docs.djangoproject.com/en/stable/howto/deployment/checklist/
