from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Avg, Case, When, IntegerField, Value
from django.db.models.functions import TruncDate
from datetime import datetime, timedelta
from .models import Ticket
from .serializers import TicketSerializer, ClassifyRequestSerializer, ClassifyResponseSerializer
from .llm_service import LLMService


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    def get_queryset(self):
        queryset = Ticket.objects.all()
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['post'], url_path='classify')
    def classify(self, request):
        """
        Classify ticket description using LLM.
        POST /api/tickets/classify/
        Body: {"description": "..."}
        Returns: {"suggested_category": "...", "suggested_priority": "..."}
        """
        serializer = ClassifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        description = serializer.validated_data['description']
        result = LLMService.classify_ticket(description)
        
        response_serializer = ClassifyResponseSerializer(data=result)
        response_serializer.is_valid(raise_exception=True)
        
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """
        Get ticket statistics using Django ORM aggregation only.
        GET /api/tickets/stats/
        Returns aggregated statistics with no Python loops.
        """
        # Aggregate all stats in a single query using Case/When
        stats_aggregation = Ticket.objects.aggregate(
            total_tickets=Count('id'),
            open_tickets=Count('id', filter=Q(status='open')),
            
            # Priority breakdown using conditional aggregation
            priority_low=Count('id', filter=Q(priority='low')),
            priority_medium=Count('id', filter=Q(priority='medium')),
            priority_high=Count('id', filter=Q(priority='high')),
            priority_critical=Count('id', filter=Q(priority='critical')),
            
            # Category breakdown using conditional aggregation
            category_billing=Count('id', filter=Q(category='billing')),
            category_technical=Count('id', filter=Q(category='technical')),
            category_account=Count('id', filter=Q(category='account')),
            category_general=Count('id', filter=Q(category='general')),
        )
        
        total_tickets = stats_aggregation['total_tickets']
        
        # Calculate avg_tickets_per_day using ORM only
        if total_tickets > 0:
            oldest_ticket = Ticket.objects.order_by('created_at').values('created_at').first()
            if oldest_ticket:
                days_since_first = (datetime.now(oldest_ticket['created_at'].tzinfo) - oldest_ticket['created_at']).days
                days_since_first = max(days_since_first, 1)  # Avoid division by zero
                avg_tickets_per_day = round(total_tickets / days_since_first, 2)
            else:
                avg_tickets_per_day = 0.0
        else:
            avg_tickets_per_day = 0.0
        
        return Response({
            'total_tickets': total_tickets,
            'open_tickets': stats_aggregation['open_tickets'],
            'avg_tickets_per_day': avg_tickets_per_day,
            'priority_breakdown': {
                'low': stats_aggregation['priority_low'],
                'medium': stats_aggregation['priority_medium'],
                'high': stats_aggregation['priority_high'],
                'critical': stats_aggregation['priority_critical'],
            },
            'category_breakdown': {
                'billing': stats_aggregation['category_billing'],
                'technical': stats_aggregation['category_technical'],
                'account': stats_aggregation['category_account'],
                'general': stats_aggregation['category_general'],
            },
        }, status=status.HTTP_200_OK)
